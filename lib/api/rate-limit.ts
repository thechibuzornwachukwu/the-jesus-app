/**
 * lib/api/rate-limit.ts
 *
 * Dual-mode rate limiter:
 *   Option A (production): Upstash Redis sliding window — durable across cold starts.
 *                          Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars.
 *   Option B (fallback):   In-process Map-backed sliding window — zero infra, resets on cold start.
 *
 * Limits
 *   chat            20 req / hour
 *   sermon           5 req / hour
 *   courses_summary 10 req / day
 *   tone_filter     60 req / hour
 */

import { NextResponse } from 'next/server';
import { appError } from '../errors';

// ── Types ────────────────────────────────────────────────────────────────────

export type RouteKey = 'chat' | 'sermon' | 'courses_summary' | 'tone_filter';

interface LimitConfig {
  requests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // seconds until the oldest request expires
}

// ── Limit definitions ────────────────────────────────────────────────────────

const LIMITS: Record<RouteKey, LimitConfig> = {
  chat:            { requests: 20, windowSeconds: 3600 },
  sermon:          { requests: 5,  windowSeconds: 3600 },
  courses_summary: { requests: 10, windowSeconds: 86400 },
  tone_filter:     { requests: 60, windowSeconds: 3600 },
};

// ── Option B: in-process sliding window ─────────────────────────────────────
// Keyed by `${route}:${userId}` → sorted array of call timestamps (epoch ms).
// Capped at MAX_ENTRIES to prevent unbounded memory growth on long-lived instances.

const MAX_ENTRIES = 2000;
const _store = new Map<string, number[]>();

function inProcessCheck(userId: string, route: RouteKey): RateLimitResult {
  const cfg = LIMITS[route];
  const now = Date.now();
  const windowMs = cfg.windowSeconds * 1000;
  const cutoff = now - windowMs;
  const key = `${route}:${userId}`;

  // Prune timestamps outside the window
  const timestamps = (_store.get(key) ?? []).filter((t) => t > cutoff);

  const allowed = timestamps.length < cfg.requests;

  if (allowed) {
    timestamps.push(now);
    // Evict LRU entry when the store is full to prevent unbounded growth
    if (!_store.has(key) && _store.size >= MAX_ENTRIES) {
      _store.delete(_store.keys().next().value!);
    }
    _store.set(key, timestamps);
  }

  const remaining = Math.max(0, cfg.requests - timestamps.length);
  const retryAfter = allowed
    ? undefined
    : Math.ceil(((timestamps[0] ?? now) + windowMs - now) / 1000);

  return { allowed, remaining, retryAfter };
}

// ── Option A: Upstash Redis sliding window ───────────────────────────────────
// Lazily initialised; one Ratelimit instance per RouteKey, cached for reuse.

type UpstashLimiter = {
  limit: (id: string) => Promise<{ success: boolean; remaining: number; reset: number }>;
};

let _limiters: Map<RouteKey, UpstashLimiter> | null = null;
let _upstashAttempted = false; // avoid re-attempting on every request if init failed

async function getUpstashLimiters(): Promise<Map<RouteKey, UpstashLimiter> | null> {
  if (_upstashAttempted) return _limiters;
  _upstashAttempted = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const { Redis } = await import('@upstash/redis');
    const { Ratelimit } = await import('@upstash/ratelimit');

    const redis = new Redis({ url, token });
    _limiters = new Map();

    for (const [route, cfg] of Object.entries(LIMITS) as [RouteKey, LimitConfig][]) {
      _limiters.set(
        route,
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(cfg.requests, `${cfg.windowSeconds} s`),
          prefix: `ja_rl_${route}`,
        }) as UpstashLimiter,
      );
    }

    return _limiters;
  } catch {
    // Package not installed or Redis unreachable — degrade gracefully
    _limiters = null;
    return null;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Returns whether the request is allowed, plus metadata. */
export async function checkRateLimit(userId: string, route: RouteKey): Promise<RateLimitResult> {
  const limiters = await getUpstashLimiters();

  if (limiters) {
    const limiter = limiters.get(route)!;
    const res = await limiter.limit(userId);
    return {
      allowed: res.success,
      remaining: res.remaining,
      retryAfter: res.success ? undefined : Math.ceil((res.reset - Date.now()) / 1000),
    };
  }

  return inProcessCheck(userId, route);
}

/**
 * Call at the top of an AI route handler.
 * Returns a 429 NextResponse if the user is rate-limited, otherwise null.
 *
 * Usage:
 *   const limited = await guardRateLimit(user.id, 'chat');
 *   if (limited) return limited;
 */
export async function guardRateLimit(
  userId: string,
  route: RouteKey,
): Promise<NextResponse | null> {
  const result = await checkRateLimit(userId, route);
  if (!result.allowed) {
    return NextResponse.json(appError('JA-0429'), {
      status: 429,
      headers: { 'Retry-After': String(result.retryAfter ?? 60) },
    });
  }
  return null;
}

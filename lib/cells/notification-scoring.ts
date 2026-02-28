import type { ChannelCategory, CellWithPreview } from './types';

// ── Score constants ───────────────────────────────────────────────────────────
export const NOTIFICATION_CLICK = 7;
export const VIEW_AFTER_NOTIFICATION = 3;
export const MESSAGE_SENT = 5;
export const VIEW_WITHOUT_NOTIFICATION = 1;
export const IGNORED_NOTIFICATION = -2;

// ── Debounced batch accumulator ───────────────────────────────────────────────
// Accumulates deltas for 5 s, then flushes in one batch to the server action.

const pendingBatch = new Map<string, number>(); // channelId → accumulated delta
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

async function flushBatch(): Promise<void> {
  if (pendingBatch.size === 0) return;
  const snapshot = new Map(pendingBatch);
  pendingBatch.clear();
  debounceTimer = null;

  const { addNotificationScore } = await import('./actions');
  for (const [channelId, delta] of snapshot) {
    if (delta !== 0) {
      addNotificationScore(channelId, delta).catch(() => {
        // fire-and-forget: scoring failures are non-critical
      });
    }
  }
}

/**
 * Apply a score delta to a channel.  Debounced — batched calls within 5 s are
 * merged into a single server write per channel.
 */
export function applyScore(channelId: string, delta: number): void {
  pendingBatch.set(channelId, (pendingBatch.get(channelId) ?? 0) + delta);
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flushBatch, 5000);
}

// ── Channel priority sorting ──────────────────────────────────────────────────

/**
 * Returns a new categories array with channels inside each category sorted
 * so that higher-scored channels float to the top.
 */
export function sortChannelsByPriority(
  categories: ChannelCategory[],
  scores: Record<string, number>
): ChannelCategory[] {
  return categories.map((cat) => ({
    ...cat,
    channels: [...(cat.channels ?? [])].sort(
      (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)
    ),
  }));
}

// ── Priority class ────────────────────────────────────────────────────────────

export type PriorityClass = 'high' | 'medium' | 'normal';

/** high ≥ 15, medium ≥ 7, otherwise normal */
export function getChannelPriorityClass(score: number): PriorityClass {
  if (score >= 15) return 'high';
  if (score >= 7) return 'medium';
  return 'normal';
}

// ── Activity match score for discover ────────────────────────────────────────

/**
 * Returns a 0–100 relevance score for a cell given the user's interest
 * categories.  Used to sort the "For You" discover feed.
 */
export function getActivityMatchScore(
  cell: CellWithPreview,
  userCategories: string[]
): number {
  if (!userCategories || userCategories.length === 0) return 50;

  const cellCat = (cell.category ?? '').toLowerCase();
  const userCats = userCategories.map((c) => c.toLowerCase());

  if (userCats.includes(cellCat)) {
    // Category match → base 70 + recency bonus (up to 30 for activity within last 30 days)
    const recencyBoost = cell.last_activity
      ? Math.max(
          0,
          30 -
            Math.floor(
              (Date.now() - new Date(cell.last_activity).getTime()) /
                (1000 * 60 * 60 * 24)
            )
        )
      : 0;
    return Math.min(100, 70 + recencyBoost);
  }

  return 0;
}

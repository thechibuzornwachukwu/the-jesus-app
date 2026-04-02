'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, Heart, Smile, Zap, Star, Shield, RefreshCw, BookOpen } from 'lucide-react';
import type { Testimony, TestimonyCategory } from '../../lib/testify/types';

// ── Category theming ────────────────────────────────────────────────────────

const CATEGORY_GRADIENT: Record<TestimonyCategory, string> = {
  Salvation:    'linear-gradient(160deg, #6b1a0a 0%, #0f0604 100%)',
  Healing:      'linear-gradient(160deg, #0d3320 0%, #030d08 100%)',
  Provision:    'linear-gradient(160deg, #0d2040 0%, #030810 100%)',
  Breakthrough: 'linear-gradient(160deg, #2a0d40 0%, #0a0314 100%)',
  Restoration:  'linear-gradient(160deg, #3a1800 0%, #0b0600 100%)',
  Deliverance:  'linear-gradient(160deg, #1a2800 0%, #070d00 100%)',
  Marriage:     'linear-gradient(160deg, #3a0a20 0%, #120308 100%)',
  Protection:   'linear-gradient(160deg, #0a102a 0%, #03050e 100%)',
};

const CATEGORY_ACCENT: Record<TestimonyCategory, string> = {
  Salvation:    '#e05c3a',
  Healing:      '#4ade80',
  Provision:    '#60a5fa',
  Breakthrough: '#a78bfa',
  Restoration:  '#d4922a',
  Deliverance:  '#a3e635',
  Marriage:     '#f472b6',
  Protection:   '#818cf8',
};

const CATEGORY_ICON: Record<TestimonyCategory, React.ReactNode> = {
  Salvation:    <Flame size={11} />,
  Healing:      <Heart size={11} />,
  Provision:    <Star size={11} />,
  Breakthrough: <Zap size={11} />,
  Restoration:  <RefreshCw size={11} />,
  Deliverance:  <Shield size={11} />,
  Marriage:     <Heart size={11} />,
  Protection:   <BookOpen size={11} />,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

// ── Component ────────────────────────────────────────────────────────────────

interface TestimonyCardProps {
  testimony: Testimony;
  isActive: boolean;
  height: string;
}

export function TestimonyCard({ testimony, isActive, height }: TestimonyCardProps) {
  const accent = CATEGORY_ACCENT[testimony.category];
  const gradient = CATEGORY_GRADIENT[testimony.category];

  return (
    <div
      style={{
        height,
        background: gradient,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Noise/grain overlay for texture */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      {/* Radial accent glow from top-right */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* ── Header row ── */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '48px 20px 0',
          flexShrink: 0,
        }}
      >
        {/* Avatar + username */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: `${accent}22`,
              border: `1.5px solid ${accent}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
              fontSize: 13,
              fontWeight: 700,
              color: accent,
              fontFamily: 'var(--font-display)',
            }}
          >
            {testimony.author.avatar_url ? (
              <img
                src={testimony.author.avatar_url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials(testimony.author.username)
            )}
          </div>
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'var(--color-text)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              @{testimony.author.username}
            </p>
            <p
              style={{
                fontSize: 10,
                color: 'rgba(245,247,247,0.45)',
                margin: 0,
                lineHeight: 1,
                marginTop: 2,
              }}
            >
              {formatDate(testimony.created_at)}
            </p>
          </div>
        </div>

        {/* Category tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            borderRadius: 999,
            background: `${accent}1a`,
            border: `1px solid ${accent}44`,
            color: accent,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {CATEGORY_ICON[testimony.category]}
          {testimony.category}
        </div>
      </div>

      {/* ── Main content ── */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 24px',
          gap: 16,
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-testimony)',
            fontWeight: 900,
            lineHeight: 1.1,
            color: 'var(--color-text)',
            margin: 0,
            textShadow: '0 2px 16px rgba(0,0,0,0.5)',
          }}
        >
          {testimony.title}
        </h2>

        {/* Excerpt — 3 lines */}
        <p
          style={{
            fontSize: 'var(--font-size-base)',
            lineHeight: 1.65,
            color: 'rgba(245,230,200,0.80)',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {testimony.full_story}
        </p>

        {/* Read more */}
        <Link
          href={`/testify/${testimony.id}`}
          style={{
            alignSelf: 'flex-start',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            color: accent,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            letterSpacing: '0.01em',
          }}
        >
          Read full story →
        </Link>
      </div>

      {/* ── Footer row ── */}
      <div
        style={{
          position: 'relative',
          padding: '0 24px 40px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Streak badge — only shown if show_streak */}
        {testimony.show_streak && testimony.streak_days ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(212,146,42,0.15)',
              border: '1px solid rgba(212,146,42,0.35)',
              color: 'var(--color-accent)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Flame size={12} />
            Seeking God for {testimony.streak_days} days
          </div>
        ) : (
          <div />
        )}

        {/* Reaction preview counts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {([
            { key: 'amen' as const, icon: <Flame size={13} />, label: 'Amen' },
            { key: 'praying' as const, icon: <Heart size={13} />, label: 'Praying' },
            { key: 'thankful' as const, icon: <Smile size={13} />, label: 'Thankful' },
          ] as const).map(({ key, icon }) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: 'rgba(245,247,247,0.60)',
                fontSize: 12,
              }}
            >
              {icon}
              <span>{testimony.reaction_counts[key]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active indicator — subtle bottom line */}
      {isActive && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          }}
        />
      )}
    </div>
  );
}

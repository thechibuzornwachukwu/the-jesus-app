'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Flame, Heart, Smile, Share2, MessageCircle } from 'lucide-react';
import type { Testimony, ReactionType } from '../../../../lib/testify/types';
import { showToast } from '../../../../libs/shared-ui/Toast';
import { BottomSheet } from '../../../../libs/shared-ui/BottomSheet';
import { EmptyState } from '../../../../libs/shared-ui';

// ── Reaction config ─────────────────────────────────────────────────────────

const REACTIONS: { key: ReactionType; icon: React.ReactNode; label: string }[] = [
  { key: 'amen',    icon: <Flame size={20} />,  label: 'Amen'    },
  { key: 'praying', icon: <Heart size={20} />,  label: 'Praying' },
  { key: 'thankful',icon: <Smile size={20} />,  label: 'Thankful'},
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

// ── Stub comment sheet ───────────────────────────────────────────────────────

function StubCommentSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState('');

  return (
    <BottomSheet open={open} onClose={onClose} title="Comments">
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '40dvh' }}>
        <div style={{ flex: 1, marginBottom: 'var(--space-4)' }}>
          <EmptyState message="Comments coming soon. Check back shortly!" />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setText('');
            showToast('Comments are not yet enabled.', 'info');
          }}
          style={{ display: 'flex', gap: 'var(--space-2)' }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            maxLength={500}
            style={{
              flex: 1,
              borderRadius: 'var(--radius-full)',
              padding: '8px 16px',
              background: 'var(--color-surface-high)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-border)',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Post
          </button>
        </form>
      </div>
    </BottomSheet>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface TestimonyDetailClientProps {
  testimony: Testimony;
}

export function TestimonyDetailClient({ testimony }: TestimonyDetailClientProps) {
  const router = useRouter();
  const [reactions, setReactions] = useState(testimony.reaction_counts);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(testimony.user_reaction);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const handleReaction = (key: ReactionType) => {
    if (userReaction === key) {
      // Un-react
      setReactions((prev) => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
      setUserReaction(null);
    } else {
      // Switch / add
      setReactions((prev) => {
        const next = { ...prev, [key]: prev[key] + 1 };
        if (userReaction) next[userReaction] = Math.max(0, next[userReaction] - 1);
        return next;
      });
      setUserReaction(key);
    }
    // Stub: no server call yet
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/testify/${testimony.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: testimony.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard!', 'success');
      }
    } catch {
      showToast('Could not share at this time.', 'error');
    }
  };

  return (
    <>
      <StubCommentSheet open={commentsOpen} onClose={() => setCommentsOpen(false)} />

      <div
        style={{
          minHeight: '100dvh',
          background: 'var(--color-bg)',
          overflowY: 'auto',
          paddingBottom: 'calc(var(--safe-bottom, 0px) + 80px)',
        }}
      >
        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'var(--color-bg)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 'calc(var(--safe-top, 0px) + 12px) 20px 12px',
          }}
        >
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={22} />
          </button>
          <span
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
            }}
          >
            Testimony
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={handleShare}
            aria-label="Share testimony"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Share2 size={20} />
          </button>
        </div>

        <div style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Category tag */}
          <div style={{ alignSelf: 'flex-start' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                background: 'var(--color-accent-soft)',
                padding: '4px 10px',
                borderRadius: 999,
              }}
            >
              {testimony.category}
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              color: 'var(--color-text)',
              margin: 0,
            }}
          >
            {testimony.title}
          </h1>

          {/* Author row */}
          <Link
            href={`/profile/${testimony.author.username}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'var(--color-surface-high)',
                border: '1.5px solid var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--color-accent)',
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
                }}
              >
                @{testimony.author.username}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                {formatDate(testimony.created_at)}
              </p>
            </div>
          </Link>

          {/* Streak badge */}
          {testimony.show_streak && testimony.streak_days && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                background: 'rgba(212,146,42,0.12)',
                border: '1px solid rgba(212,146,42,0.30)',
                color: 'var(--color-accent)',
                fontSize: 13,
                fontWeight: 700,
                alignSelf: 'flex-start',
              }}
            >
              <Flame size={14} />
              Seeking God for {testimony.streak_days} days
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--color-border)' }} />

          {/* Full story */}
          <div
            style={{
              fontSize: 'var(--font-size-base)',
              lineHeight: 1.8,
              color: 'var(--color-text)',
              whiteSpace: 'pre-line',
            }}
          >
            {testimony.full_story}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--color-border)' }} />

          {/* Reaction bar */}
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                margin: '0 0 12px',
              }}
            >
              React
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {REACTIONS.map(({ key, icon, label }) => {
                const active = userReaction === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleReaction(key)}
                    aria-pressed={active}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 999,
                      border: `1.5px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      background: active ? 'var(--color-accent-soft)' : 'transparent',
                      color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s, color 0.15s',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {icon}
                    <span>{label}</span>
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: active ? 'var(--color-accent)' : 'var(--color-text-faint)',
                        fontWeight: 700,
                      }}
                    >
                      {reactions[key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comments button */}
          <button
            onClick={() => setCommentsOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 18px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              justifyContent: 'center',
              transition: 'background 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <MessageCircle size={16} />
            View Comments
          </button>
        </div>
      </div>
    </>
  );
}

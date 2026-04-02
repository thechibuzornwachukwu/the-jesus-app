'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Hash } from 'lucide-react';
import { Skeleton } from '../shared-ui/Skeleton';
import { vibrate } from '../shared-ui/haptics';
import type { TrendingVerse } from '../../lib/discover/actions';

interface TrendingTagsProps {
  verses: TrendingVerse[];
  loading?: boolean;
}

export function TrendingTags({ verses, loading }: TrendingTagsProps) {
  const router = useRouter();

  function navigate(ref: string) {
    vibrate([8]);
    const href = `/discover/verses/${encodeURIComponent(ref)}`;
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void })
        .startViewTransition(() => router.push(href));
    } else {
      router.push(href);
    }
  }

  return (
    <section>
      <p
        style={{
          margin: '0 0 var(--space-2) var(--space-4)',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        Word
      </p>

      <div
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingLeft: 'var(--space-4)',
          paddingRight: 'var(--space-4)',
          paddingBottom: 4,
        }}
      >
        {loading
          ? [...Array(6)].map((_, i) => (
              <Skeleton
                key={i}
                style={{ height: 34, width: 100 + i * 12, borderRadius: 'var(--radius-full)', flexShrink: 0 }}
              />
            ))
          : verses.length === 0
          ? (
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: 'var(--color-text-faint)',
                  fontStyle: 'italic',
                  paddingLeft: 0,
                }}
              >
                No trending verses yet. Save a verse to get started.
              </p>
            )
          : verses.map((v) => (
              <button
                key={v.verse_reference}
                onClick={() => navigate(v.verse_reference)}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  color: 'var(--color-text)',
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.12s, border-color 0.12s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-soft)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-accent)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                }}
              >
                <Hash size={12} color="var(--color-accent)" strokeWidth={2.5} aria-hidden />
                {v.verse_reference}
                <span
                  style={{
                    marginLeft: 2,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-accent-soft)',
                    color: 'var(--color-accent)',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {v.save_count}
                </span>
              </button>
            ))}
      </div>
    </section>
  );
}

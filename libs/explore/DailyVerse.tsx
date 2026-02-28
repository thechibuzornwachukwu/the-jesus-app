'use client';

import React, { useState } from 'react';
import type { DailyVerseType } from '../../lib/explore/types';
import { BottomSheet } from '../shared-ui/BottomSheet';

interface DailyVerseProps {
  verse: DailyVerseType;
}

export function DailyVerse({ verse }: DailyVerseProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          background: 'var(--gradient-verse-banner)',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--space-3) var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          textAlign: 'left',
          cursor: 'pointer',
        }}
        aria-label={`Daily verse: ${verse.reference}. Tap to meditate.`}
      >
        {/* Cross accent */}
        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>✝</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 'var(--space-1)',
            }}
          >
            Today · {verse.reference}
          </p>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {verse.text}
          </p>
        </div>
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-accent)',
            flexShrink: 0,
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          Meditate →
        </span>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={verse.reference}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <blockquote
            style={{
              borderLeft: '3px solid var(--color-accent)',
              paddingLeft: 'var(--space-4)',
              margin: 0,
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--font-size-xl)',
                lineHeight: 'var(--line-height-relaxed)',
                color: 'var(--color-text-primary)',
                fontStyle: 'italic',
              }}
            >
              "{verse.text}"
            </p>
            <cite
              style={{
                display: 'block',
                marginTop: 'var(--space-2)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-accent)',
                fontStyle: 'normal',
                fontWeight: 'var(--font-weight-semibold)',
              }}
            >
              — {verse.reference}
            </cite>
          </blockquote>

          <div
            style={{
              background: 'var(--color-accent-tint)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 'var(--space-2)',
              }}
            >
              Reflection
            </p>
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                lineHeight: 'var(--line-height-relaxed)',
                color: 'var(--color-text-primary)',
              }}
            >
              {verse.reflection}
            </p>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

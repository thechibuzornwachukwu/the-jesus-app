'use client';

import React, { useState } from 'react';
import { deleteSavedVerse } from '../../lib/profile/actions';
import type { SavedVerse } from './types';
import { EmptyState } from '../shared-ui';

interface SavedVersesListProps {
  verses: SavedVerse[];
}

export function SavedVersesList({ verses: initial }: SavedVersesListProps) {
  const [verses, setVerses] = useState(initial);

  async function handleDelete(ref: string) {
    setVerses((v) => v.filter((x) => x.verse_reference !== ref));
    await deleteSavedVerse(ref);
  }

  if (verses.length === 0) {
    return <EmptyState message="No saved verses yet — tap the bookmark icon on videos to save." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4) 0' }}>
      {verses.map((v) => (
        <div
          key={v.verse_reference}
          style={{
            background: 'var(--color-bg-surface)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            border: '1px solid var(--color-border)',
            position: 'relative',
          }}
        >
          <p
            style={{
              fontWeight: 'var(--font-weight-semibold)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-accent-soft)',
              margin: '0 0 var(--space-2)',
            }}
          >
            {v.verse_reference}
          </p>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              lineHeight: 'var(--line-height-relaxed)',
              margin: 0,
              paddingRight: 'var(--space-8)',
            }}
          >
            {v.verse_text}
          </p>
          <button
            onClick={() => handleDelete(v.verse_reference)}
            aria-label="Remove verse"
            style={{
              position: 'absolute',
              top: 'var(--space-3)',
              right: 'var(--space-3)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: 'var(--space-1)',
              lineHeight: 1,
              fontSize: '1.1rem',
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

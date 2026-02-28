'use client';

import React, { useState } from 'react';
import { Bookmark, X } from 'lucide-react';
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
    return (
      <EmptyState
        icon={<Bookmark size={40} />}
        message="Watch a Witness video and tap the bookmark to save a verse."
      />
    );
  }

  return (
    <div style={{ paddingTop: 'var(--space-4)' }}>
      <p
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-faint)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 'var(--font-weight-semibold)',
          margin: '0 0 var(--space-3)',
        }}
      >
        {verses.length} {verses.length === 1 ? 'verse' : 'verses'} saved
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {verses.map((v) => (
          <div
            key={v.verse_reference}
            style={{
              background: 'var(--color-surface)',
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
                color: 'var(--color-accent)',
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
                color: 'var(--color-text-faint)',
                padding: 'var(--space-1)',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

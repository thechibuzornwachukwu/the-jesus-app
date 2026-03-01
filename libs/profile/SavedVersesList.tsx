'use client';

import React, { useState } from 'react';
import { Bookmark, X, ChevronDown } from 'lucide-react';
import { deleteSavedVerse, updateVerseNote } from '../../lib/profile/actions';
import { logStreakEvent } from '../../lib/streaks/actions';
import type { SavedVerse } from './types';
import { EmptyState } from '../shared-ui';

interface SavedVersesListProps {
  verses: SavedVerse[];
}

function VerseCard({ verse, onDelete }: { verse: SavedVerse; onDelete: () => void }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(verse.note ?? '');
  const [saving, setSaving] = useState(false);

  async function handleBlur() {
    if (note === (verse.note ?? '')) return;
    setSaving(true);
    await updateVerseNote(verse.verse_reference, note);
    if (note.trim().length > 0) {
      await logStreakEvent('verse_save_with_note');
    }
    setSaving(false);
  }

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      {/* Main row */}
      <div style={{ padding: 'var(--space-4)', position: 'relative' }}>
        <p
          style={{
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-accent)',
            margin: '0 0 var(--space-2)',
          }}
        >
          {verse.verse_reference}
        </p>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
            lineHeight: 'var(--line-height-relaxed)',
            margin: 0,
            paddingRight: 'var(--space-10)',
          }}
        >
          {verse.verse_text}
        </p>

        {/* Delete */}
        <button
          onClick={onDelete}
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

      {/* Note toggle */}
      <button
        onClick={() => setNoteOpen((o) => !o)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          borderTop: '1px solid var(--color-border)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-2) var(--space-4)',
          color: note.trim() ? 'var(--color-accent)' : 'var(--color-text-faint)',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 'var(--font-weight-medium)',
        }}
      >
        <span>{note.trim() ? 'My note' : 'Add a note…'}</span>
        <ChevronDown
          size={14}
          style={{
            transition: 'transform 0.2s',
            transform: noteOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Note input (expandable) */}
      {noteOpen && (
        <div style={{ padding: '0 var(--space-4) var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleBlur}
            placeholder="Write a personal reflection…"
            maxLength={2000}
            rows={3}
            style={{
              width: '100%',
              marginTop: 'var(--space-3)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-2) var(--space-3)',
              color: 'var(--color-text)',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 'var(--line-height-relaxed)',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)';
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          />
          {saving && (
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-faint)' }}>
              Saving…
            </p>
          )}
        </div>
      )}
    </div>
  );
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
          <VerseCard
            key={v.verse_reference}
            verse={v}
            onDelete={() => handleDelete(v.verse_reference)}
          />
        ))}
      </div>
    </div>
  );
}

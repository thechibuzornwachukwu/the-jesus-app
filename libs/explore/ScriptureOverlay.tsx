'use client';

import React, { useState } from 'react';
import type { VideoVerse } from '../../lib/explore/types';

interface ScriptureOverlayProps {
  verse: VideoVerse;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

export function ScriptureOverlay({ verse, onSave, saving, saved }: ScriptureOverlayProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded((e) => !e)}
      style={{
        position: 'absolute',
        bottom: 'calc(var(--space-10) + var(--space-4))',
        left: 'var(--space-3)',
        right: 'calc(56px + var(--space-3) + var(--space-3))', // leave room for action buttons
        background: 'var(--color-glass)',
        backdropFilter: 'blur(8px)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3) var(--space-3)',
        textAlign: 'left',
        border: 'none',
        cursor: 'pointer',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
        transition: 'all 0.25s ease',
      }}
      aria-expanded={expanded}
      aria-label={expanded ? 'Collapse verse' : 'Expand verse'}
    >
      <p
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-accent)',
          letterSpacing: '0.04em',
        }}
      >
        {verse.verse_reference}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text)',
          lineHeight: 'var(--line-height-normal)',
          display: expanded ? undefined : '-webkit-box',
          WebkitLineClamp: expanded ? undefined : 1,
          WebkitBoxOrient: expanded ? undefined : 'vertical',
          overflow: expanded ? undefined : 'hidden',
        }}
      >
        {verse.verse_text}
      </p>

      {expanded && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          disabled={saving || saved}
          style={{
            alignSelf: 'flex-start',
            marginTop: 'var(--space-2)',
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-accent)',
            background: saved ? 'var(--color-accent)' : 'transparent',
            color: saved ? 'var(--color-text-inverse)' : 'var(--color-accent)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: saving || saved ? 'default' : 'pointer',
          }}
        >
          {saved ? 'Saved ✓' : saving ? 'Saving…' : '+ Save Verse'}
        </button>
      )}
    </button>
  );
}

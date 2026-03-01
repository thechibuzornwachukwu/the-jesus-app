'use client';

import React, { useState } from 'react';
import type { DailyVerseType } from '../../lib/explore/types';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { ChevronRight, Bookmark } from 'lucide-react';
import { saveVerse } from '../../lib/explore/actions';
import { showToast } from '../shared-ui';

interface DailyVerseProps {
  verse: DailyVerseType;
}

export function DailyVerse({ verse }: DailyVerseProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (saved || saving) return;
    setSaving(true);
    const { error } = await saveVerse(verse.reference, verse.text);
    setSaving(false);
    if (error) {
      showToast(error, 'error');
    } else {
      setSaved(true);
      showToast('Verse saved', 'success');
    }
  };

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
        {/* Cross accent  inline SVG cross (lucide has no crucifix) */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--color-accent)', opacity: 0.85 }}>
          <path d="M12 3v18M3 9h18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
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
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)',
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
          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>Meditate <ChevronRight size={14} /></span>
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
               {verse.reference}
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

          <button
            onClick={handleSave}
            disabled={saved || saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-accent)',
              background: saved ? 'var(--color-accent)' : 'transparent',
              color: saved ? 'var(--color-accent-text)' : 'var(--color-accent)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: saved || saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Verse saved' : saving ? 'Saving…' : 'Save verse'}
          </button>
        </div>
      </BottomSheet>
    </>
  );
}

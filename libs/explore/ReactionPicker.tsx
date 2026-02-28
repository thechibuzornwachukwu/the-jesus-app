'use client';

import React, { useCallback, useRef, useState } from 'react';
import type { ReactionType } from '../../lib/explore/types';
import { vibrate } from '../shared-ui/haptics';

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'heart',  emoji: '❤️',  label: 'Heart'  },
  { type: 'amen',   emoji: '🙏',  label: 'Amen'   },
  { type: 'laugh',  emoji: '😂',  label: 'Laugh'  },
  { type: 'shock',  emoji: '😮',  label: 'Shock'  },
];

const DEFAULT_REACTION = REACTIONS[0]; // heart

interface ReactionPickerProps {
  userReaction: ReactionType | null;
  counts: Record<ReactionType, number>;
  onReact: (type: ReactionType) => void;
}

export function ReactionPicker({ userReaction, counts, onReact }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHold = useRef(false);

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const active = REACTIONS.find((r) => r.type === userReaction) ?? null;
  const displayEmoji = active?.emoji ?? DEFAULT_REACTION.emoji;

  // Long-press / hold → open picker
  const onPressStart = useCallback(() => {
    didHold.current = false;
    holdTimer.current = setTimeout(() => {
      didHold.current = true;
      vibrate([6]);
      setOpen(true);
    }, 200);
  }, []);

  const onPressEnd = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }, []);

  // Tap (no hold) → toggle current reaction on/off
  const onTap = useCallback(() => {
    if (didHold.current) return; // handled by picker
    vibrate([8]);
    const tap = userReaction ?? DEFAULT_REACTION.type;
    onReact(tap);
  }, [userReaction, onReact]);

  const handleSelect = useCallback(
    (type: ReactionType) => {
      vibrate([8]);
      setOpen(false);
      onReact(type);
    },
    [onReact]
  );

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Expanded picker */}
      {open && (
        <>
          {/* Backdrop to close */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
          />
          <div
            role="listbox"
            aria-label="Pick a reaction"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'row',
              gap: 4,
              background: 'rgba(20,20,30,0.92)',
              backdropFilter: 'blur(8px)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 10px',
              zIndex: 11,
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
              animation: 'pickerPop 0.18s cubic-bezier(0.34,1.56,0.64,1) forwards',
              whiteSpace: 'nowrap',
            }}
          >
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                role="option"
                aria-selected={userReaction === r.type}
                aria-label={r.label}
                onClick={() => handleSelect(r.type)}
                style={{
                  background: userReaction === r.type ? 'rgba(244,117,33,0.25)' : 'none',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  width: 44,
                  height: 44,
                  cursor: 'pointer',
                  fontSize: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.12s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.3)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Collapsed trigger */}
      <button
        aria-label={userReaction ? `Reaction: ${active?.label}` : 'Add reaction'}
        aria-expanded={open}
        onMouseDown={onPressStart}
        onMouseUp={onPressEnd}
        onTouchStart={onPressStart}
        onTouchEnd={onPressEnd}
        onClick={onTap}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 0,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.6))',
            transition: 'transform 0.12s cubic-bezier(0.34,1.56,0.64,1)',
            transform: userReaction ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {displayEmoji}
        </span>
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-bright)',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          {totalCount > 999 ? `${(totalCount / 1000).toFixed(1)}k` : totalCount}
        </span>
      </button>

      <style>{`
        @keyframes pickerPop {
          0%   { opacity: 0; transform: translateX(-50%) scale(0.7); }
          100% { opacity: 1; transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </div>
  );
}

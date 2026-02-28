'use client';

import React, { useRef, useState } from 'react';
import { LogOut, BellOff } from 'lucide-react';
import { vibrate } from '../shared-ui/haptics';

interface SwipeToActionProps {
  children: React.ReactNode;
  onLeave?: () => void;
  onMute?: () => void;
}

const THRESHOLD = 72;   // px to trigger action reveal
const SNAP_FULL = 80;   // px to reveal action buttons

export function SwipeToAction({ children, onLeave, onMute }: SwipeToActionProps) {
  const startX = useRef(0);
  const [offsetX, setOffsetX] = useState(0);
  const [revealed, setRevealed] = useState<'left' | 'right' | null>(null);
  const dragging = useRef(false);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    dragging.current = true;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    // Clamp between -SNAP_FULL and +SNAP_FULL
    setOffsetX(Math.max(-SNAP_FULL, Math.min(SNAP_FULL, dx)));
  }

  function onTouchEnd() {
    dragging.current = false;
    if (offsetX < -THRESHOLD) {
      // Swiped left → reveal Leave
      vibrate([6, 30, 6]);
      setOffsetX(-SNAP_FULL);
      setRevealed('left');
    } else if (offsetX > THRESHOLD) {
      // Swiped right → reveal Mute
      vibrate([6, 30, 6]);
      setOffsetX(SNAP_FULL);
      setRevealed('right');
    } else {
      setOffsetX(0);
      setRevealed(null);
    }
  }

  function close() {
    setOffsetX(0);
    setRevealed(null);
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
      {/* Left action (Leave) — shown on swipe-left */}
      <div
        aria-hidden={revealed !== 'left'}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: SNAP_FULL,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-error)',
          borderRadius: 'var(--radius-md)',
          opacity: offsetX < 0 ? Math.min(1, Math.abs(offsetX) / THRESHOLD) : 0,
          transition: 'opacity 0.15s',
        }}
      >
        <button
          onClick={() => { close(); onLeave?.(); }}
          aria-label="Leave cell"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#fff' }}
        >
          <LogOut size={18} />
          <span style={{ fontSize: 10, fontWeight: 700 }}>Leave</span>
        </button>
      </div>

      {/* Right action (Mute) — shown on swipe-right */}
      <div
        aria-hidden={revealed !== 'right'}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: SNAP_FULL,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-surface-high)',
          borderRadius: 'var(--radius-md)',
          opacity: offsetX > 0 ? Math.min(1, offsetX / THRESHOLD) : 0,
          transition: 'opacity 0.15s',
        }}
      >
        <button
          onClick={() => { close(); onMute?.(); }}
          aria-label="Mute cell"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)' }}
        >
          <BellOff size={18} />
          <span style={{ fontSize: 10, fontWeight: 700 }}>Mute</span>
        </button>
      </div>

      {/* Card itself */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: dragging.current ? 'none' : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          zIndex: 1,
          background: 'var(--color-bg)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {children}
      </div>

      {/* Tap-outside overlay to close */}
      {revealed && (
        <div
          onClick={close}
          style={{ position: 'fixed', inset: 0, zIndex: 0 }}
          aria-hidden
        />
      )}
    </div>
  );
}

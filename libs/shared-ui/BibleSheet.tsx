'use client';

import { useEffect, useRef, useState } from 'react';
import { BibleReader } from '../bible/BibleReader';

// ── Snap points ───────────────────────────────────────────────────────────────
// The sheet is 96dvh tall, anchored to bottom: 0.
// translateY(0) = fully open. Higher value = more hidden.
type SnapPoint = 'full' | 'half' | 'peek';

const SNAP_TRANSLATE: Record<SnapPoint, string> = {
  full: '0px',
  half: '41dvh',   // 55dvh of the 96dvh sheet is visible
  peek: 'calc(96dvh - 80px)', // only ~80px of handle+title visible
};

// Visible-height thresholds (fraction of viewport height) to decide which snap
// wins after a drag ends.
const SNAP_THRESHOLDS: [SnapPoint, number][] = [
  ['full', 0.65],   // > 65dvh visible → full
  ['half', 0.30],   // > 30dvh visible → half
  ['peek', 0.05],   // > 5dvh visible  → peek
  // else → dismiss
];

interface BibleSheetProps {
  open: boolean;
  onClose: () => void;
}

export function BibleSheet({ open, onClose }: BibleSheetProps) {
  const [snap, setSnap] = useState<SnapPoint>('full');
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [mounted, setMounted] = useState(false);

  const dragStartY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Animate in: mount first, then let CSS transition snap to 'full'
  useEffect(() => {
    if (open) {
      setSnap('full');
      setDragOffset(0);
      // Trigger mount with a tiny delay so the initial translateY(100%) can
      // transition into translateY(0).
      const id = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(id);
    } else {
      setMounted(false);
    }
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const baseTranslate = mounted ? SNAP_TRANSLATE[snap] : '100%';
  const totalTranslate = dragOffset !== 0
    ? `calc(${baseTranslate} + ${dragOffset}px)`
    : baseTranslate;

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragStartY.current = e.clientY;
    setDragging(true);
    setDragOffset(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    // Allow dragging down (positive) freely; resist dragging up past full
    setDragOffset(Math.max(-40, delta));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    dragStartY.current = null;
    setDragging(false);
    setDragOffset(0);

    // Determine how much of the sheet is visible after the drag
    const rect = sheetRef.current?.getBoundingClientRect();
    if (!rect) return;

    const visiblePx = window.innerHeight - rect.top;
    const visibleFraction = visiblePx / window.innerHeight;

    // Detect a fast downward flick (velocity heuristic: >80px drag)
    const fastFlick = delta > 80;

    if (fastFlick && snap === 'full') {
      setSnap('half');
      return;
    }
    if (fastFlick && snap === 'half') {
      setSnap('peek');
      return;
    }

    // Otherwise snap to nearest based on visible fraction
    for (const [point, threshold] of SNAP_THRESHOLDS) {
      if (visibleFraction > threshold) {
        setSnap(point);
        return;
      }
    }
    // Below all thresholds → dismiss
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Bible reader"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '96dvh',
          background: 'var(--color-bg)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.45)',
          border: '1px solid var(--color-border)',
          borderBottom: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: `translateY(${totalTranslate})`,
          transition: dragging ? 'none' : 'transform 0.38s cubic-bezier(0.32,0.72,0,1)',
          willChange: 'transform',
        }}
      >
        {/* ── Drag handle ── */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            paddingTop: 12,
            paddingBottom: 4,
            flexShrink: 0,
            cursor: dragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          {/* Pill */}
          <div
            style={{
              width: 44,
              height: 4,
              borderRadius: 2,
              background: 'var(--color-border)',
              transition: 'background 0.15s',
            }}
          />

          {/* Snap indicator dots */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {(['full', 'half', 'peek'] as SnapPoint[]).map((s) => (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); setSnap(s); }}
                aria-label={`Snap to ${s}`}
                style={{
                  width: snap === s ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  background: snap === s ? 'var(--color-accent)' : 'var(--color-border)',
                  transition: 'width 0.2s ease, background 0.2s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Bible content ── */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <BibleReader
            bottomPadding="calc(var(--safe-bottom, 0px) + var(--space-10))"
          />
        </div>
      </div>
    </div>
  );
}

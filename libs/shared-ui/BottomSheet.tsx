'use client';

import React, { useEffect, useRef, useState } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const DISMISS_THRESHOLD = 120;

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Reset drag state when sheet closes
  useEffect(() => {
    if (!open) {
      setDragStartY(null);
      setDragCurrentY(0);
      setIsDragging(false);
    }
  }, [open]);

  if (!open) return null;

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    setDragStartY(e.clientY);
    setDragCurrentY(0);
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragStartY === null) return;
    const delta = Math.max(0, e.clientY - dragStartY);
    setDragCurrentY(delta);
  }

  function onPointerUp(_e: React.PointerEvent<HTMLDivElement>) {
    if (dragCurrentY >= DISMISS_THRESHOLD) {
      onClose();
    }
    setDragStartY(null);
    setDragCurrentY(0);
    setIsDragging(false);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          background: 'var(--color-bg-surface)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--color-border)',
          borderBottom: 'none',
          transform: isDragging ? `translateY(${dragCurrentY}px)` : 'translateY(0)',
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Drag handle */}
        <div
          ref={handleRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 'var(--space-3)',
            paddingBottom: 'var(--space-3)',
            flexShrink: 0,
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}
        >
          <div
            style={{
              width: 48,
              height: 5,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-accent-soft)',
            }}
          />
        </div>

        {/* Title row */}
        {title && (
          <div
            style={{
              padding: '0 var(--space-6) var(--space-3)',
              borderBottom: '1px solid var(--color-border)',
              flexShrink: 0,
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              {title}
            </h3>
          </div>
        )}

        {/* Scrollable content */}
        <div
          style={{
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            flex: 1,
            padding: 'var(--space-4) var(--space-6)',
            paddingBottom: 'calc(var(--safe-bottom, 0px) + var(--space-4))',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

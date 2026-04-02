'use client';

import React, { useEffect, useRef, useState } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  contentScrollable?: boolean;
  contentStyle?: React.CSSProperties;
  /** Rendered outside the scroll area, always visible above the keyboard */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const DISMISS_THRESHOLD = 120;
// Match sheet-exit duration in globals.css
const EXIT_DURATION_MS = 240;

export function BottomSheet({
  open,
  onClose,
  title,
  contentScrollable = true,
  contentStyle,
  footer,
  children,
}: BottomSheetProps) {
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  // mounted: whether the DOM node should exist; closing: play exit animation
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
    } else if (mounted && !closing) {
      setClosing(true);
      const t = setTimeout(() => {
        setMounted(false);
        setClosing(false);
      }, EXIT_DURATION_MS);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = (mounted && !closing) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mounted, closing]);

  // Reset drag state when sheet closes
  useEffect(() => {
    if (!open) {
      setDragStartY(null);
      setDragCurrentY(0);
      setIsDragging(false);
    }
  }, [open]);

  if (!mounted) return null;

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
        zIndex: 'var(--z-modal-full)',
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
          opacity: closing ? 0 : 1,
          transition: `opacity ${EXIT_DURATION_MS}ms ease`,
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className={closing ? 'sheet-exit' : isDragging ? undefined : 'sheet-enter'}
        style={{
          position: 'relative',
          width: '100%',
          background: 'var(--color-bg-surface)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--color-border)',
          borderBottom: 'none',
          transform: isDragging ? `translateY(${dragCurrentY}px)` : undefined,
          transition: isDragging ? 'none' : undefined,
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
            overflowY: contentScrollable ? 'auto' : 'hidden',
            overscrollBehavior: 'contain',
            flex: 1,
            padding: contentScrollable ? 'var(--space-4) var(--space-6)' : 0,
            paddingBottom: contentScrollable
              ? 'calc(var(--nav-height, 64px) + var(--safe-bottom, 0px) + var(--space-4))'
              : 0,
            ...contentStyle,
          }}
        >
          {children}
        </div>

        {/* Footer — outside scroll area, always visible */}
        {footer && (
          <div
            style={{
              flexShrink: 0,
              borderTop: '1px solid var(--color-border)',
              padding: 'var(--space-3) var(--space-6)',
              paddingBottom: 'calc(var(--safe-bottom, 0px) + var(--space-3))',
              background: 'var(--color-bg-surface)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

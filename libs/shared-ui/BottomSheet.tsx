'use client';

import React, { useEffect } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

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
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 'var(--space-3)',
            paddingBottom: 'var(--space-2)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-border)',
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

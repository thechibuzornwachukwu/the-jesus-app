'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface FullScreenModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  footerContent?: React.ReactNode;
  children: React.ReactNode;
  zIndex?: string;
}

export function FullScreenModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  action,
  footerContent,
  children,
  zIndex = 'var(--z-modal)',
}: FullScreenModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        background: 'var(--color-bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 430,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: `calc(var(--safe-top) + var(--space-4)) var(--space-4) var(--space-4)`,
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-accent)',
            cursor: 'pointer',
            padding: 0,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronLeft size={24} />
        </button>
        {icon && (
          <span style={{ color: 'var(--color-accent)', fontSize: 'var(--font-size-lg)' }}>
            {icon}
          </span>
        )}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)' as React.CSSProperties['fontWeight'],
              color: 'var(--color-text-primary)',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>

      {/* Optional footer */}
      {footerContent && <div style={{ flexShrink: 0 }}>{footerContent}</div>}
    </div>
  );
}

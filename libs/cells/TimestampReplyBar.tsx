'use client';

import React from 'react';
import { X } from 'lucide-react';

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface TimestampReplyBarProps {
  username: string;
  timestampSeconds: number;
  onDismiss: () => void;
}

export function TimestampReplyBar({ username, timestampSeconds, onDismiss }: TimestampReplyBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: '6px var(--space-3)',
        background: 'var(--color-accent-soft)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-2)',
        borderLeft: '3px solid var(--color-accent)',
      }}
    >
      <span
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          flex: 1,
          lineHeight: 1.4,
        }}
      >
        Replying to{' '}
        <span
          style={{
            color: 'var(--color-accent)',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          {formatTimestamp(timestampSeconds)}
        </span>{' '}
        in <span style={{ color: 'var(--color-text)' }}>{username}</span>'s voice note
      </span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss reply"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          padding: 2,
          flexShrink: 0,
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

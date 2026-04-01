'use client';

import React from 'react';

interface StreakWidgetProps {
  current: number;
  longest: number;
}

export function StreakWidget({ current, longest }: StreakWidgetProps) {
  return (
    <div
      style={{
        margin: 'var(--space-3) var(--space-4) 0',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-3) var(--space-4)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 'var(--font-size-base)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text)',
        }}
      >
        🔥 {current}-day streak
      </p>
      <p
        style={{
          margin: 'var(--space-1) 0 0',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
        }}
      >
        Best: {longest} days
      </p>
    </div>
  );
}

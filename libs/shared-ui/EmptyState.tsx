import React from 'react';

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
  padding?: string;
}

export function EmptyState({
  message,
  icon,
  padding = 'var(--space-12) var(--space-4)',
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding,
        gap: 'var(--space-3)',
        color: 'var(--color-text-muted)',
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-faint)' }}>{icon}</span>}
      <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 'var(--line-height-relaxed)' }}>
        {message}
      </p>
    </div>
  );
}

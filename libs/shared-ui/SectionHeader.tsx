import React from 'react';

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionHeader({ children, className = '' }: SectionHeaderProps) {
  return (
    <h2
      className={className}
      style={{
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-semibold)' as React.CSSProperties['fontWeight'],
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--letter-spacing-wide)',
        marginBottom: 'var(--space-3)',
      }}
    >
      {children}
    </h2>
  );
}

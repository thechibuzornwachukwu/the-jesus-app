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
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 'var(--font-weight-bold)' as React.CSSProperties['fontWeight'],
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginBottom: 'var(--space-3)',
      }}
    >
      {children}
    </h2>
  );
}

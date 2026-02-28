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
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 900 as React.CSSProperties['fontWeight'],
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.10em',
        marginBottom: 'var(--space-3)',
      }}
    >
      {children}
    </h2>
  );
}

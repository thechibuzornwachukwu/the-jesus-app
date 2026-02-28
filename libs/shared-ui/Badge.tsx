import React from 'react';

type BadgeVariant = 'default' | 'accent' | 'success' | 'error';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
  accent:  'bg-[var(--color-accent)] text-[var(--color-text-inverse)]',
  success: 'bg-[var(--color-success)]/20 text-[var(--color-success)]',
  error:   'bg-[var(--color-error)]/20 text-[var(--color-error)]',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-[var(--space-2)] py-0.5 rounded-[var(--radius-full)] text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)] ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

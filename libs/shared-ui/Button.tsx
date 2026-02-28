import React from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-accent-text)] font-[var(--font-weight-semibold)] px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-full)] hover:brightness-110 active:brightness-90',
  ghost:
    'bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)] font-[var(--font-weight-medium)] px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-full)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]',
  icon:
    'bg-transparent p-[var(--space-2)] rounded-[var(--radius-full)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]',
};

export function Button({ variant = 'primary', loading = false, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-[var(--space-2)] text-[length:var(--font-size-base)] transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
}

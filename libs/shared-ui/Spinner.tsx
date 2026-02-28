import React from 'react';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 24, className = '' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

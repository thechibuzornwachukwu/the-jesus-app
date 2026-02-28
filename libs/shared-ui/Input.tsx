import React from 'react';
import { Label } from './Typography';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-[var(--space-1)] w-full">
      {label && <Label htmlFor={id}>{label}</Label>}
      <input
        id={id}
        {...props}
        className={`w-full bg-[var(--color-bg-surface)] border rounded-[var(--radius-md)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-base)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors duration-150 ${
          error
            ? 'border-[var(--color-error)] focus:border-[var(--color-error)]'
            : 'border-[var(--color-border)] focus:border-[var(--color-border-focus)]'
        } ${className}`}
      />
      {error && (
        <span className="text-[length:var(--font-size-xs)] text-[var(--color-error)]">{error}</span>
      )}
    </div>
  );
}

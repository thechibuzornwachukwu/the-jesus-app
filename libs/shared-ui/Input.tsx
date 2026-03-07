'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

/* ─── Input ──────────────────────────────────────────────────────────────── */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  id,
  icon,
  className = '',
  type: typeProp = 'text',
  placeholder,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = typeProp === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : typeProp;

  const paddingLeft = icon ? 'pl-[2.75rem]' : 'pl-[var(--space-4)]';
  const paddingRight = isPassword ? 'pr-[2.75rem]' : 'pr-[var(--space-4)]';

  const borderClasses = error
    ? 'border border-l-2 border-[var(--color-error)] focus:border-[var(--color-error)]'
    : 'border border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:shadow-[var(--input-focus-ring)]';

  // If a real placeholder is provided, use it — styled invisible at rest, subtle on focus.
  // If none, fall back to a single space which enables the :placeholder-shown CSS trick
  // without showing any hint text.
  const resolvedPlaceholder = placeholder ?? ' ';

  return (
    <div className="flex flex-col gap-[var(--space-1)] w-full">
      <div className="relative">
        {/* Leading icon */}
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none flex items-center">
            {icon}
          </span>
        )}

        {/* Placeholder opacity: hidden at rest, subtle on focus so it doesn't compete with the floating label */}
        <input
          id={id}
          type={inputType}
          {...props}
          placeholder={resolvedPlaceholder}
          className={[
            'peer w-full h-[var(--input-height)] bg-[var(--input-bg)]',
            'rounded-[var(--radius-lg)] outline-none',
            'pt-5 pb-2 text-[length:var(--font-size-base)] text-[var(--color-text)]',
            'transition-all duration-[180ms] ease-[ease]',
            '[&::placeholder]:opacity-0 [&::placeholder]:transition-opacity [&::placeholder]:duration-[180ms]',
            'focus:[&::placeholder]:opacity-40',
            paddingLeft,
            paddingRight,
            borderClasses,
            className,
          ].join(' ')}
        />

        {/* Floating label — active color also applied when field has a value (pre-filled) */}
        <label
          htmlFor={id}
          className={[
            'absolute top-1/2 -translate-y-1/2 origin-left pointer-events-none',
            'text-[length:var(--font-size-base)] text-[var(--input-label-color)]',
            'transition-all duration-[180ms] ease-[ease]',
            icon ? 'left-[2.75rem]' : 'left-[var(--space-4)]',
            // Floated on focus
            'peer-focus:top-2 peer-focus:translate-y-0 peer-focus:scale-[0.80] peer-focus:text-[var(--input-label-active)]',
            // Floated when field has a value — also active color so pre-filled looks the same as interacted
            'peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:scale-[0.80] peer-[:not(:placeholder-shown)]:text-[var(--input-label-active)]',
          ].join(' ')}
        >
          {label}
        </label>

        {/* Password visibility toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <span className="flex items-center gap-[var(--space-1)] text-[length:var(--font-size-xs)] text-[var(--color-error)]">
          <AlertCircle size={12} />
          {error}
        </span>
      )}
    </div>
  );
}

/* ─── TextareaInput ──────────────────────────────────────────────────────── */

interface TextareaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  rows?: number;
}

export function TextareaInput({
  label,
  error,
  id,
  rows = 3,
  className = '',
  placeholder,
  ...props
}: TextareaInputProps) {
  const borderClasses = error
    ? 'border border-l-2 border-[var(--color-error)] focus:border-[var(--color-error)]'
    : 'border border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:shadow-[var(--input-focus-ring)]';

  const resolvedPlaceholder = placeholder ?? ' ';

  return (
    <div className="flex flex-col gap-[var(--space-1)] w-full">
      <div className="relative">
        <textarea
          id={id}
          rows={rows}
          {...props}
          placeholder={resolvedPlaceholder}
          className={[
            'peer w-full bg-[var(--input-bg)] rounded-[var(--radius-lg)]',
            'px-[var(--space-4)] pt-7 pb-[var(--space-3)]',
            'text-[length:var(--font-size-base)] text-[var(--color-text)]',
            'resize-none outline-none transition-all duration-[180ms] ease-[ease]',
            '[&::placeholder]:opacity-0 [&::placeholder]:transition-opacity [&::placeholder]:duration-[180ms]',
            'focus:[&::placeholder]:opacity-40',
            borderClasses,
            className,
          ].join(' ')}
        />

        {/* Floating label — active color also applied when pre-filled */}
        <label
          htmlFor={id}
          className={[
            'absolute left-[var(--space-4)] top-4 pointer-events-none origin-left',
            'text-[length:var(--font-size-base)] text-[var(--input-label-color)]',
            'transition-all duration-[180ms] ease-[ease]',
            // Floated on focus
            'peer-focus:top-2 peer-focus:scale-[0.80] peer-focus:text-[var(--input-label-active)]',
            // Floated when field has a value — also active color
            'peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:scale-[0.80] peer-[:not(:placeholder-shown)]:text-[var(--input-label-active)]',
          ].join(' ')}
        >
          {label}
        </label>
      </div>

      {/* Error message */}
      {error && (
        <span className="flex items-center gap-[var(--space-1)] text-[length:var(--font-size-xs)] text-[var(--color-error)]">
          <AlertCircle size={12} />
          {error}
        </span>
      )}
    </div>
  );
}

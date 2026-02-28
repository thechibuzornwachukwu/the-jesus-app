import React from 'react';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4';

interface HeadingProps {
  as?: HeadingLevel;
  children: React.ReactNode;
  className?: string;
}

export function Heading({ as: Tag = 'h2', children, className = '' }: HeadingProps) {
  const sizeMap: Record<HeadingLevel, string> = {
    h1: 'text-[length:var(--font-size-3xl)] font-[var(--font-weight-bold)] leading-[var(--line-height-tight)]',
    h2: 'text-[length:var(--font-size-2xl)] font-[var(--font-weight-bold)] leading-[var(--line-height-tight)]',
    h3: 'text-[length:var(--font-size-xl)] font-[var(--font-weight-semibold)] leading-[var(--line-height-tight)]',
    h4: 'text-[length:var(--font-size-lg)] font-[var(--font-weight-semibold)] leading-[var(--line-height-normal)]',
  };
  return (
    <Tag className={`text-[var(--color-text-primary)] ${sizeMap[Tag]} ${className}`}>
      {children}
    </Tag>
  );
}

interface BodyProps {
  size?: 'sm' | 'base' | 'lg';
  muted?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Body({ size = 'base', muted = false, children, className = '' }: BodyProps) {
  const sizeMap = {
    sm: 'text-[length:var(--font-size-sm)]',
    base: 'text-[length:var(--font-size-base)]',
    lg: 'text-[length:var(--font-size-lg)]',
  };
  const color = muted ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]';
  return (
    <p className={`${sizeMap[size]} ${color} leading-[var(--line-height-normal)] ${className}`}>
      {children}
    </p>
  );
}

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

export function Label({ children, htmlFor, className = '' }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-[length:var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-muted)] ${className}`}
    >
      {children}
    </label>
  );
}

interface DisplayProps {
  children: React.ReactNode;
  className?: string;
}

export function Display({ children, className = '' }: DisplayProps) {
  return (
    <h1
      className={className}
      style={{
        fontFamily: "'Archivo Condensed', var(--font-display)",
        fontWeight: 900,
        fontSize: 'var(--font-size-4xl)',
        lineHeight: 'var(--line-height-tight)',
        letterSpacing: 'var(--letter-spacing-tight)',
        color: 'var(--color-text-primary)',
      }}
    >
      {children}
    </h1>
  );
}

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-[var(--space-4)] shadow-[var(--shadow-sm)] ${onClick ? 'cursor-pointer hover:border-[var(--color-accent)] transition-colors duration-150' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

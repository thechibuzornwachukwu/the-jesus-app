'use client';

import React, { useState, useCallback } from 'react';
import { vibrate } from './haptics';

interface FABProps {
  onClick: () => void;
  icon: React.ReactNode;
  ariaLabel: string;
  size?: number;
  bottomOffset?: string;
  zIndex?: string;
}

export function FAB({
  onClick,
  icon,
  ariaLabel,
  size = 52,
  bottomOffset = 'var(--space-4)',
  zIndex = 'var(--z-overlay)',
}: FABProps) {
  const [springing, setSpringing] = useState(false);

  const handleClick = useCallback(() => {
    vibrate([10]);
    setSpringing(false);
    // Force reflow so animation restarts
    requestAnimationFrame(() => {
      setSpringing(true);
      setTimeout(() => setSpringing(false), 350);
    });
    onClick();
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      aria-label={ariaLabel}
      className={springing ? 'fab-spring-trigger' : ''}
      style={{
        position: 'fixed',
        right: 'var(--space-4)',
        bottom: `calc(var(--nav-height) + var(--safe-bottom) + ${bottomOffset})`,
        width: size,
        height: size,
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-accent)',
        color: 'var(--color-accent-text)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        fontWeight: 'var(--font-weight-bold)' as React.CSSProperties['fontWeight'],
        boxShadow: 'var(--shadow-lg)',
        zIndex,
        transition: 'box-shadow 0.15s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {icon}
    </button>
  );
}

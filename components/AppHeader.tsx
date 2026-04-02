'use client';

import React from 'react';
import { Flame } from 'lucide-react';

interface AppHeaderProps {
  streakCount: number;
}

export function AppHeader({ streakCount }: AppHeaderProps) {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        height: 'var(--header-height)',
        paddingTop: 'var(--safe-top, 0px)',
        zIndex: 'var(--z-header)',
        backgroundColor: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 'var(--space-4)',
        paddingRight: 'var(--space-3)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      } as React.CSSProperties}
    >
      {/* Wordmark */}
      <span
        style={{
          fontFamily: 'var(--font-display, "Archivo Condensed", sans-serif)',
          fontWeight: 800,
          fontSize: '1.1rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-text)',
        }}
      >
        The JESUS App
      </span>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {/* Streak */}
        <div
          title={`${streakCount}-day streak`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            color: streakCount > 0 ? 'var(--color-accent)' : 'var(--color-text-faint)',
            fontSize: '0.8rem',
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          <Flame size={16} strokeWidth={1.5} fill={streakCount > 0 ? 'currentColor' : 'none'} aria-hidden />
          <span>{streakCount}</span>
        </div>
      </div>
    </header>
  );
}

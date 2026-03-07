'use client';

import { useState } from 'react';
import { AuthForm } from './AuthForm';
import { signIn, signUp } from '../../lib/auth/actions';

function CrossLogo() {
  return (
    <svg
      width="52"
      height="64"
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 12px rgba(244,117,33,0.45))' }}
    >
      <rect x="13" y="0" width="6" height="40" rx="2" fill="var(--color-accent)" />
      <rect x="0" y="12" width="32" height="6" rx="2" fill="var(--color-accent)" />
    </svg>
  );
}

export function AuthGateScreen() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        padding: 'var(--space-6)',
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <CrossLogo />
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 'var(--font-size-4xl)',
              letterSpacing: '-0.03em',
              color: 'var(--color-text)',
              margin: 0,
              lineHeight: 1,
            }}
          >
            The JESUS App
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text-muted)',
              margin: 'var(--space-2) 0 0',
            }}
          >
            Connect. Grow. Worship.
          </p>
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8) var(--space-6)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        {/* Mode tabs */}
        <div
          role="tablist"
          style={{
            display: 'flex',
            gap: 'var(--space-1)',
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-1)',
            marginBottom: 'var(--space-6)',
          }}
        >
          {(['sign-in', 'sign-up'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'calc(var(--radius-lg) - 2px)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontWeight: 'var(--font-weight-medium)',
                fontSize: 'var(--font-size-sm)',
                transition: 'background 0.15s, color 0.15s',
                background: mode === m ? 'var(--color-accent)' : 'transparent',
                color: mode === m ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
              }}
            >
              {m === 'sign-in' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <AuthForm mode={mode} action={mode === 'sign-in' ? signIn : signUp} />
      </div>
    </div>
  );
}

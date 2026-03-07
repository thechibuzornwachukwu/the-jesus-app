'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { AuthForm } from './AuthForm';
import { signIn } from '../../lib/auth/actions';
import { signUp } from '../../lib/auth/actions';

interface AuthModalProps {
  defaultMode?: 'sign-in' | 'sign-up';
  onClose: () => void;
}

export function AuthModal({ defaultMode = 'sign-in', onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>(defaultMode);

  return (
    <>
      <style>{`
        @keyframes auth-modal-sheet-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'sign-in' ? 'Sign in' : 'Create account'}
        style={{
          position: 'fixed', inset: 0, zIndex: 400,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          background: 'rgba(4,5,3,0.72)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          style={{
            width: '100%', maxWidth: 480,
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
            border: '1px solid var(--color-border)',
            borderBottom: 'none',
            padding: 'var(--space-6)',
            paddingBottom: 'calc(var(--space-8) + env(safe-area-inset-bottom, 0px))',
            maxHeight: '94dvh',
            overflowY: 'auto',
            animation: 'auth-modal-sheet-up 0.32s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--color-border)' }} />
          </div>

          {/* Close button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-2)' }}>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)', padding: 'var(--space-1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Mode tabs */}
          <div style={{
            display: 'flex', gap: 0,
            borderBottom: '1px solid var(--color-border)',
            marginBottom: 'var(--space-6)',
          }}>
            {(['sign-in', 'sign-up'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 'var(--font-size-sm)', fontWeight: 700,
                  paddingBottom: 'var(--space-3)',
                  color: mode === m ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  borderBottom: mode === m ? '2px solid var(--color-accent)' : '2px solid transparent',
                  marginBottom: '-1px',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                {m === 'sign-in' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <AuthForm mode={mode} action={mode === 'sign-in' ? signIn : signUp} />
        </div>
      </div>
    </>
  );
}

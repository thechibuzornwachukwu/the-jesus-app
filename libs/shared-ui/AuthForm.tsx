'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

type AuthAction = (state: unknown, formData: FormData) => Promise<{ error?: string; success?: string }>;

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up';
  action: AuthAction;
}

const initialState = { error: undefined, success: undefined };

function CrossIcon() {
  return (
    <svg width="48" height="60" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 8px rgba(212,146,42,0.35))' }}
    >
      <rect x="13" y="0" width="6" height="40" rx="2" fill="var(--color-accent)" />
      <rect x="0" y="12" width="32" height="6" rx="2" fill="var(--color-accent)" />
    </svg>
  );
}

function SignUpSuccessModal({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(4);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(id); onDone(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-6)',
        background: 'rgba(11,9,5,0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'toast-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 360,
          background: 'rgba(22,16,9,0.96)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          padding: 'var(--space-8) var(--space-6)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)',
          textAlign: 'center',
        }}
      >
        <CrossIcon />
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'var(--font-size-2xl)',
            letterSpacing: '-0.02em',
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Welcome to the family.
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-muted)',
            margin: 0,
          }}
        >
          Check your email to confirm your account.
        </p>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-faint)', margin: 0 }}>
          Redirecting to sign in in {count}s…
        </p>
      </div>
    </div>
  );
}

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const isSignIn = mode === 'sign-in';

  useEffect(() => {
    if (state?.success && !isSignIn) {
      setModalOpen(true);
    }
  }, [state?.success, isSignIn]);

  return (
    <>
      {modalOpen && (
        <SignUpSuccessModal onDone={() => { setModalOpen(false); router.push('/sign-in'); }} />
      )}

      <div style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 'var(--font-size-4xl)',
              letterSpacing: '-0.02em',
              color: 'var(--color-text)',
              margin: 0,
            }}
          >
            {isSignIn ? 'Welcome back' : 'Join the family'}
          </h1>
        </div>

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            icon={<Mail size={16} />}
          />
          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder={isSignIn ? '••••••••' : 'At least 8 characters'}
            autoComplete={isSignIn ? 'current-password' : 'new-password'}
            required
          />

          {state?.error && (
            <p
              role="alert"
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-error)',
                borderLeft: '2px solid var(--color-error)',
                paddingLeft: 'var(--space-2)',
                margin: 0,
              }}
            >
              {state.error}
            </p>
          )}

          <Button type="submit" loading={pending} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
            {isSignIn ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-6) 0 var(--space-4)' }} />

        <p style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: 0 }}>
          {isSignIn ? "Don't have an account? " : 'Already have an account? '}
          <Link
            href={isSignIn ? '/sign-up' : '/sign-in'}
            style={{ color: 'var(--color-accent)', fontWeight: 'var(--font-weight-medium)', textDecoration: 'none' }}
          >
            {isSignIn ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </div>
    </>
  );
}

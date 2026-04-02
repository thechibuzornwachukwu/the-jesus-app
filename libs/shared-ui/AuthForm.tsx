'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { signInWithGoogle } from '../../lib/auth/oauth';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

type AuthAction = (state: unknown, formData: FormData) => Promise<{ error?: string; success?: string }>;

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up';
  action: AuthAction;
  magicLinkAction?: AuthAction;
}

const initialState = { error: undefined, success: undefined };

function CrossIcon() {
  return (
    <svg width="40" height="50" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="13" y="0" width="6" height="40" rx="3" fill="var(--color-accent)" />
      <rect x="0" y="12" width="32" height="6" rx="3" fill="var(--color-accent)" />
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
        background: 'rgba(4,5,3,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'toast-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 360,
          background: 'rgba(23,22,56,0.98)',
          border: '1px solid rgba(244,117,33,0.25)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 0 0 1px rgba(244,117,33,0.08), 0 32px 80px rgba(0,0,0,0.7)',
          padding: 'var(--space-10) var(--space-6)',
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
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-muted)',
            margin: 0,
          }}
        >
          Check your email to confirm your account.
        </p>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-faint)', margin: 0 }}>
          Redirecting in {count}s…
        </p>
      </div>
    </div>
  );
}

export function AuthForm({ mode, action, magicLinkAction }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [mlState, mlFormAction, mlPending] = useActionState(
    magicLinkAction ?? (async () => ({ error: undefined, success: undefined })),
    initialState,
  );
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
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-faint)',
              margin: '0 0 var(--space-3)',
              letterSpacing: '0.01em',
            }}
          >
            {isSignIn ? '"Draw near to God, and he will draw near to you."' : '"You are no longer strangers, but family."'}
          </p>
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

        {/* Google OAuth */}
        <button
          type="button"
          onClick={signInWithGoogle}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-3)',
            padding: '0.75rem var(--space-4)',
            background: 'rgba(245,247,247,0.04)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
            marginBottom: 'var(--space-5)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(244,117,33,0.5)';
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-soft)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,247,247,0.04)';
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            or email
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        </div>

        {/* Main form */}
        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
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
            icon={<Lock size={16} />}
          />

          {state?.error && (
            <p
              role="alert"
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-error)',
                borderLeft: '2px solid var(--color-error)',
                paddingLeft: 'var(--space-3)',
                margin: '0.25rem 0 0',
              }}
            >
              {state.error}
            </p>
          )}

          <Button type="submit" loading={pending} style={{ width: '100%', marginTop: 'var(--space-3)' }}>
            {isSignIn ? 'Sign In' : 'Create Account'}
          </Button>

          {/* Inline consent — sign-up only, no gate */}
          {!isSignIn && (
            <p
              style={{
                textAlign: 'center',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-faint)',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              By creating an account you agree to our{' '}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
                Terms of Service
              </Link>.
            </p>
          )}
        </form>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-6) 0 var(--space-4)' }} />

        <p style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: 0 }}>
          {isSignIn ? "New here? " : 'Already have an account? '}
          <Link
            href={isSignIn ? '/sign-up' : '/sign-in'}
            style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}
          >
            {isSignIn ? 'Join the family' : 'Sign in'}
          </Link>
        </p>

        {/* Magic link — sign-in only */}
        {isSignIn && magicLinkAction && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', margin: 'var(--space-4) 0 var(--space-3)' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                or magic link
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            </div>

            <form action={mlFormAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                id="ml-email"
                name="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                icon={<Mail size={16} />}
              />

              {mlState?.error && (
                <p
                  role="alert"
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-error)',
                    borderLeft: '2px solid var(--color-error)',
                    paddingLeft: 'var(--space-3)',
                    margin: 0,
                  }}
                >
                  {mlState.error}
                </p>
              )}

              {mlState?.success ? (
                <div
                  style={{
                    background: 'rgba(74,222,128,0.06)',
                    border: '1px solid rgba(74,222,128,0.2)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    display: 'grid',
                    gap: 'var(--space-2)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-success)', fontWeight: 600 }}>
                    {mlState.success}
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    If you&apos;re new here, a new account will be created automatically when you click the link.
                  </p>
                </div>
              ) : (
                <Button type="submit" loading={mlPending} style={{ width: '100%' }}>
                  Send magic link
                </Button>
              )}
            </form>
          </>
        )}
      </div>
    </>
  );
}

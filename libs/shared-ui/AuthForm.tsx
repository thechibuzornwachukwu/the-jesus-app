'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';
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

function PolicyPreviewModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-preview-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 210,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        background: 'rgba(11,9,5,0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'rgba(22,16,9,0.97)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <h2
          id="policy-preview-title"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--font-size-2xl)',
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Privacy and Terms Preview
        </h2>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Before creating your account, please review:
        </p>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', display: 'grid', gap: '0.35rem' }}>
          <li>What information is collected and how it is used in-app.</li>
          <li>How your data is protected and when it may be shared with providers.</li>
          <li>Your rights to access, correct, or delete personal information.</li>
          <li>Account responsibilities and acceptable use requirements.</li>
        </ul>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Full documents:
          {' '}
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
          {' '}
          and
          {' '}
          <Link href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
            Terms of Service
          </Link>
          .
        </p>
        <Button type="button" onClick={onClose}>
          I have reviewed this
        </Button>
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
  const [policyPreviewOpen, setPolicyPreviewOpen] = useState(false);
  const [hasReviewedPolicies, setHasReviewedPolicies] = useState(false);
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
      {policyPreviewOpen && (
        <PolicyPreviewModal
          onClose={() => {
            setPolicyPreviewOpen(false);
            setHasReviewedPolicies(true);
          }}
        />
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
            padding: 'var(--space-3) var(--space-4)',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-medium)',
            cursor: 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
            marginBottom: 'var(--space-4)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-accent)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-soft)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-faint)', whiteSpace: 'nowrap' }}>
            or continue with email
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
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

          {!isSignIn && (
            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                display: 'grid',
                gap: 'var(--space-3)',
              }}
            >
              <Button type="button" onClick={() => setPolicyPreviewOpen(true)} style={{ width: '100%' }}>
                Review Privacy and Terms
              </Button>
              <label
                htmlFor="acceptPolicies"
                style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}
              >
                <input
                  id="acceptPolicies"
                  name="acceptPolicies"
                  type="checkbox"
                  value="true"
                  required
                  disabled={!hasReviewedPolicies}
                  style={{ marginTop: 2 }}
                />
                <span>
                  I agree to the
                  {' '}
                  <Link href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
                    Privacy Policy
                  </Link>
                  {' '}
                  and
                  {' '}
                  <Link href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
                    Terms of Service
                  </Link>
                  .
                </span>
              </label>
              {!hasReviewedPolicies && (
                <p style={{ margin: 0, color: 'var(--color-text-faint)', fontSize: 'var(--font-size-xs)' }}>
                  Please open the preview first, then check the consent box to continue.
                </p>
              )}
            </div>
          )}

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

        {isSignIn && magicLinkAction && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', margin: 'var(--space-2) 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-faint)', whiteSpace: 'nowrap' }}>
                or use a magic link
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
                    paddingLeft: 'var(--space-2)',
                    margin: 0,
                  }}
                >
                  {mlState.error}
                </p>
              )}

              {mlState?.success ? (
                <div
                  style={{
                    background: 'rgba(74,222,128,0.08)',
                    border: '1px solid rgba(74,222,128,0.25)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    display: 'grid',
                    gap: 'var(--space-2)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-success)', fontWeight: 'var(--font-weight-medium)' }}>
                    {mlState.success}
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    If you&apos;re new to this version of the app, a new account will be created automatically when you click the link.
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

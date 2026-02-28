'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Input } from './Input';
import { Button } from './Button';
import { Heading, Body } from './Typography';

type AuthAction = (state: unknown, formData: FormData) => Promise<{ error?: string; success?: string }>;

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up';
  action: AuthAction;
}

const initialState = { error: undefined, success: undefined };

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isSignIn = mode === 'sign-in';

  return (
    <div style={{ width: '100%', maxWidth: 380 }}>
      {/* Logo placeholder */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <div
          style={{
            width: 64, height: 64, borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-accent)', margin: '0 auto var(--space-4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 28 }}>✝</span>
        </div>
        <Heading as="h1">{isSignIn ? 'Welcome back' : 'Join the community'}</Heading>
        <Body muted className="mt-1">{isSignIn ? 'Sign in to continue' : 'Create your account'}</Body>
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
          <p role="alert" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error)' }}>
            {state.error}
          </p>
        )}
        {state?.success && (
          <p role="status" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-success)' }}>
            {state.success}
          </p>
        )}

        <Button type="submit" loading={pending} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
          {isSignIn ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
        {isSignIn ? "Don't have an account? " : 'Already have an account? '}
        <Link
          href={isSignIn ? '/sign-up' : '/sign-in'}
          style={{ color: 'var(--color-accent)', fontWeight: 'var(--font-weight-medium)', textDecoration: 'none' }}
        >
          {isSignIn ? 'Sign up' : 'Sign in'}
        </Link>
      </p>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, UserCircle } from 'lucide-react';

export function CompleteProfileBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <UserCircle size={18} color="var(--color-accent)" style={{ flexShrink: 0 }} />
      <p style={{ flex: 1, margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
        Your profile is incomplete.{' '}
        <Link
          href="/profile"
          style={{ color: 'var(--color-accent)', fontWeight: 'var(--font-weight-medium)', textDecoration: 'none' }}
        >
          Complete your profile
        </Link>{' '}
        to get the most out of the app.
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          padding: 4,
          cursor: 'pointer',
          color: 'var(--color-text-faint)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

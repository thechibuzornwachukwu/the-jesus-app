'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, X } from 'lucide-react';

export function CompleteProfileBanner() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px var(--space-4)',
        background: 'var(--color-accent-soft)',
        borderBottom: '1px solid var(--color-accent)',
        flexShrink: 0,
      }}
    >
      <AlertCircle size={15} color="var(--color-accent)" aria-hidden />
      <p style={{ flex: 1, margin: 0, fontSize: 13, color: 'var(--color-text)' }}>
        Complete your profile to connect with others.{' '}
        <button
          onClick={() => router.push('/profile/edit')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-accent)',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Set up now
        </button>
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          padding: 2,
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

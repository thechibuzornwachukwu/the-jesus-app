'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookHeart } from 'lucide-react';
import { vibrate } from '../shared-ui/haptics';

export const YOUR_VERSES_KEY = 'your_verses';

export function getYourVerseRefs(): string[] {
  try {
    const raw = localStorage.getItem(YOUR_VERSES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveYourVerseRef(ref: string) {
  try {
    const prev = getYourVerseRefs().filter((r) => r !== ref);
    localStorage.setItem(YOUR_VERSES_KEY, JSON.stringify([ref, ...prev].slice(0, 3)));
  } catch {
    // ignore
  }
}

export function YourVerses() {
  const router = useRouter();
  const [refs, setRefs] = useState<string[]>([]);

  useEffect(() => {
    setRefs(getYourVerseRefs());
  }, []);

  if (refs.length === 0) return null;

  function navigate(ref: string) {
    vibrate([8]);
    const href = `/discover/verses/${encodeURIComponent(ref)}`;
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void })
        .startViewTransition(() => router.push(href));
    } else {
      router.push(href);
    }
  }

  return (
    <section>
      <p
        style={{
          margin: '0 0 var(--space-2) var(--space-4)',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        Your Verses
      </p>
      <div
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingLeft: 'var(--space-4)',
          paddingRight: 'var(--space-4)',
          paddingBottom: 4,
        }}
      >
        {refs.map((ref) => (
          <button
            key={ref}
            onClick={() => navigate(ref)}
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-accent-soft)',
              border: '1px solid var(--color-accent)',
              cursor: 'pointer',
              color: 'var(--color-accent)',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              WebkitTapHighlightColor: 'transparent',
              transition: 'opacity 0.12s',
            }}
          >
            <BookHeart size={12} aria-hidden />
            {ref}
          </button>
        ))}
      </div>
    </section>
  );
}

'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to console in dev; swap for your error reporter (Sentry, etc.) in prod
    console.error('[JA-0500]', error);
  }, [error]);

  return (
    <div style={styles.shell}>
      {/* Background cross watermark */}
      <svg
        aria-hidden="true"
        style={styles.watermark}
        viewBox="0 0 120 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="44" y="0"  width="32" height="160" rx="6" fill="currentColor" />
        <rect x="0"  y="44" width="120" height="32" rx="6" fill="currentColor" />
      </svg>

      <div style={styles.card}>
        {/* Error code badge */}
        <span style={styles.codeBadge}>JA-0500</span>

        {/* Headline */}
        <h1 style={styles.heading}>Something went wrong.</h1>

        <p style={styles.body}>
          An unexpected error occurred. Our team has been notified. Please
          try again or return home.
        </p>

        {/* Digest for support reference */}
        {error.digest && (
          <p style={styles.digest}>
            Reference:&nbsp;
            <code style={styles.digestCode}>{error.digest}</code>
          </p>
        )}

        <div style={styles.actions}>
          <button onClick={reset} style={styles.btnPrimary}>
            Try again
          </button>
          <a href="/" style={styles.btnGhost}>
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Inline styles — uses CSS vars from tokens.css via root layout ─────── */
const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-bg, #0b0905)',
    color: 'var(--color-text, #f0e6c8)',
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    padding: '1.5rem',
    position: 'relative',
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    bottom: '-10%',
    right: '-6%',
    width: 'min(320px, 55vw)',
    opacity: 0.04,
    color: 'var(--color-accent, #d4922a)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 420,
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  codeBadge: {
    display: 'inline-block',
    fontSize: 'var(--font-size-xs, 0.75rem)',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--color-accent, #d4922a)',
    backgroundColor: 'var(--color-accent-soft, rgba(212,146,42,0.12))',
    border: '1px solid rgba(212,146,42,0.25)',
    borderRadius: 6,
    padding: '0.25rem 0.625rem',
  },
  heading: {
    fontFamily: 'var(--font-display, "Archivo Condensed", system-ui, sans-serif)',
    fontWeight: 900,
    fontSize: 'clamp(2rem, 8vw, 3rem)',
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    margin: 0,
    color: 'var(--color-text, #f0e6c8)',
  },
  body: {
    fontSize: 'var(--font-size-sm, 0.875rem)',
    color: 'var(--color-text-muted, rgba(240,230,200,0.6))',
    lineHeight: 1.6,
    maxWidth: 340,
    margin: 0,
  },
  digest: {
    fontSize: 'var(--font-size-xs, 0.75rem)',
    color: 'var(--color-text-faint, rgba(240,230,200,0.35))',
    margin: 0,
  },
  digestCode: {
    fontFamily: 'monospace',
    fontSize: 'inherit',
    color: 'var(--color-text-muted, rgba(240,230,200,0.5))',
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  btnPrimary: {
    padding: '0.625rem 1.5rem',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    fontWeight: 600,
    fontSize: 'var(--font-size-sm, 0.875rem)',
    backgroundColor: 'var(--color-accent, #d4922a)',
    color: 'var(--color-accent-text, #0b0905)',
    transition: 'opacity 0.15s',
  },
  btnGhost: {
    display: 'inline-block',
    padding: '0.625rem 1.5rem',
    borderRadius: 8,
    border: '1px solid var(--color-border, rgba(240,230,200,0.1))',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    fontWeight: 600,
    fontSize: 'var(--font-size-sm, 0.875rem)',
    color: 'var(--color-text-muted, rgba(240,230,200,0.6))',
    textDecoration: 'none',
    backgroundColor: 'transparent',
  },
};

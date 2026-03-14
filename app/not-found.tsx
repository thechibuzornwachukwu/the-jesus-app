import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found — The JESUS App',
};

export default function NotFound() {
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
        <span style={styles.codeBadge}>JA-0404</span>

        {/* Big number */}
        <p style={styles.bigNumber} aria-hidden="true">404</p>

        {/* Headline */}
        <h1 style={styles.heading}>This page doesn&apos;t exist.</h1>

        <p style={styles.verse}>
          <em>
            &ldquo;I am the way, the truth, and the life.&rdquo;
          </em>
          <span style={styles.verseRef}>— John 14:6</span>
        </p>

        <p style={styles.body}>
          The page you&apos;re looking for may have moved or never existed.
          Let&apos;s get you back on track.
        </p>

        <div style={styles.actions}>
          <Link href="/" style={styles.btnPrimary}>
            Go home
          </Link>
          <Link href="/explore" style={styles.btnGhost}>
            Explore
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Inline styles — CSS vars available via root layout ─────────────────── */
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
    gap: '0.875rem',
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
  bigNumber: {
    fontFamily: 'var(--font-display, "Archivo Condensed", system-ui, sans-serif)',
    fontWeight: 900,
    fontSize: 'clamp(5rem, 22vw, 8rem)',
    lineHeight: 1,
    letterSpacing: '-0.04em',
    margin: 0,
    color: 'var(--color-accent, #d4922a)',
    opacity: 0.18,
    pointerEvents: 'none',
    userSelect: 'none',
  },
  heading: {
    fontFamily: 'var(--font-display, "Archivo Condensed", system-ui, sans-serif)',
    fontWeight: 900,
    fontSize: 'clamp(1.75rem, 7vw, 2.5rem)',
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    margin: '-2rem 0 0',  // pull up under faint "404"
    color: 'var(--color-text, #f0e6c8)',
  },
  verse: {
    fontFamily: 'var(--font-serif, "Newsreader", Georgia, serif)',
    fontSize: 'var(--font-size-sm, 0.875rem)',
    fontStyle: 'italic',
    color: 'var(--color-text-muted, rgba(240,230,200,0.6))',
    margin: '0.25rem 0 0',
    lineHeight: 1.6,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  verseRef: {
    fontStyle: 'normal',
    fontSize: 'var(--font-size-xs, 0.75rem)',
    color: 'var(--color-text-faint, rgba(240,230,200,0.35))',
    letterSpacing: '0.04em',
  },
  body: {
    fontSize: 'var(--font-size-sm, 0.875rem)',
    color: 'var(--color-text-muted, rgba(240,230,200,0.55))',
    lineHeight: 1.6,
    maxWidth: 320,
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  btnPrimary: {
    display: 'inline-block',
    padding: '0.625rem 1.5rem',
    borderRadius: 8,
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    fontWeight: 600,
    fontSize: 'var(--font-size-sm, 0.875rem)',
    backgroundColor: 'var(--color-accent, #d4922a)',
    color: 'var(--color-accent-text, #0b0905)',
    textDecoration: 'none',
  },
  btnGhost: {
    display: 'inline-block',
    padding: '0.625rem 1.5rem',
    borderRadius: 8,
    border: '1px solid var(--color-border, rgba(240,230,200,0.1))',
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    fontWeight: 600,
    fontSize: 'var(--font-size-sm, 0.875rem)',
    color: 'var(--color-text-muted, rgba(240,230,200,0.6))',
    textDecoration: 'none',
    backgroundColor: 'transparent',
  },
};

import Link from 'next/link';

function CrossSVG() {
  return (
    <svg width="24" height="30" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="13" y="0" width="6" height="40" rx="2" fill="var(--color-accent)" />
      <rect x="0" y="12" width="32" height="6" rx="2" fill="var(--color-accent)" />
    </svg>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        paddingTop: 'calc(var(--safe-top) + var(--space-6))',
        paddingBottom: 'calc(var(--safe-bottom) + var(--space-6))',
        backgroundColor: 'var(--color-bg)',
        overflow: 'hidden',
      }}
    >
      {/* Top accent strip */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)',
          opacity: 0.6,
        }}
      />

      {/* Back to home */}
      <Link
        href="/"
        style={{
          position: 'absolute',
          top: 'calc(var(--safe-top) + var(--space-4))',
          left: 'var(--space-5)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-muted)',
          textDecoration: 'none',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 500,
          transition: 'color 0.15s',
          zIndex: 10,
        }}
        onMouseOver={undefined}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Home
      </Link>

      {/* Orange radial glow at bottom-centre */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vw',
          height: '60vh',
          background: 'radial-gradient(ellipse at bottom center, rgba(244,117,33,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Branding above card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <CrossSVG />
        <span
          style={{
            fontFamily: '"Archivo Condensed", sans-serif',
            fontWeight: 900,
            fontSize: 'var(--font-size-xl)',
            letterSpacing: '-0.01em',
            color: 'var(--color-text)',
          }}
        >
          The JESUS App
        </span>
      </div>

      {/* Content card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          background: 'rgba(23,22,56,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          padding: 'var(--space-8) var(--space-6)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

import Link from 'next/link';

function CrossSVG() {
  return (
    <svg width="36" height="45" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="13" y="0" width="6" height="40" rx="2" fill="var(--color-accent)" />
      <rect x="0" y="12" width="32" height="6" rx="2" fill="var(--color-accent)" />
    </svg>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        paddingTop: 'calc(var(--safe-top) + var(--space-6))',
        paddingBottom: 'calc(var(--safe-bottom) + var(--space-6))',
        backgroundColor: 'var(--color-bg)',
        position: 'relative',
      }}
    >
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
          fontFamily: 'var(--font-sans)',
          fontWeight: 500,
          zIndex: 10,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Home
      </Link>

      {/* Brand mark */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <CrossSVG />
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'var(--font-size-xl)',
            letterSpacing: '-0.01em',
            color: 'var(--color-text)',
          }}
        >
          THE JESUS APP
        </span>
      </div>

      {/* Content card */}
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(22,16,9,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          padding: 'var(--space-8) var(--space-6)',
          animation: 'toast-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {children}
      </div>
    </div>
  );
}

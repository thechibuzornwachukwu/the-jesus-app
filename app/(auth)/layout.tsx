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

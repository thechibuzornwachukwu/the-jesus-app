import React from 'react';

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
  padding?: string;
  imageSrc?: string;
}

export function EmptyState({
  message,
  icon,
  padding = 'var(--space-12) var(--space-4)',
  imageSrc,
}: EmptyStateProps) {
  if (imageSrc) {
    return (
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          minHeight: 180,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding,
          gap: 'var(--space-3)',
        }}
      >
        {/* background photo */}
        <img
          src={imageSrc}
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        {/* dark scrim */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--color-glass)',
          }}
        />
        {/* content */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
          {icon && (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)', opacity: 0.9 }}>
              {icon}
            </span>
          )}
          <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 'var(--line-height-relaxed)', color: 'var(--color-text)', maxWidth: 240, margin: 0 }}>
            {message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding,
        gap: 'var(--space-3)',
        color: 'var(--color-text-muted)',
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-faint)' }}>{icon}</span>}
      <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 'var(--line-height-relaxed)' }}>
        {message}
      </p>
    </div>
  );
}

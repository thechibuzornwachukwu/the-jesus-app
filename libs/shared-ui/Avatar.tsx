import React from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ src, name, size = 40, className = '' }: AvatarProps) {
  const style = { width: size, height: size, minWidth: size };
  if (src) {
    return (
      <div
        style={style}
        className={`rounded-full overflow-hidden bg-[var(--color-bg-surface)] relative ${className}`}
      >
        <Image src={src} alt={name ?? 'avatar'} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div
      style={style}
      className={`rounded-full flex items-center justify-center bg-[var(--color-accent)] text-[var(--color-text-inverse)] font-[var(--font-weight-semibold)] select-none ${className}`}
    >
      <span style={{ fontSize: size * 0.4 }}>{getInitials(name)}</span>
    </div>
  );
}

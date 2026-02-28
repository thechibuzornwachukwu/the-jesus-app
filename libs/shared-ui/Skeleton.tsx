'use client';

import React from 'react';

interface SkeletonProps {
  w?: string | number;
  h?: string | number;
  radius?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  w = '100%',
  h = 16,
  radius = 'var(--radius-sm)',
  style,
}: SkeletonProps) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: typeof h === 'number' ? `${h}px` : h,
        borderRadius: radius,
        background: 'var(--color-surface-high)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

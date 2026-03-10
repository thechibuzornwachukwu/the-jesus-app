'use client';

import React, { useRef, useState, useCallback } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  /** The scrollable container — defaults to wrapping the children in a div */
  children: React.ReactNode;
  /** Pixel distance the user must pull before refresh fires (default 72) */
  threshold?: number;
  style?: React.CSSProperties;
  className?: string;
}

const THRESHOLD_DEFAULT = 72;
const MAX_PULL = 96; // clamp overdrag

export function PullToRefresh({
  onRefresh,
  children,
  threshold = THRESHOLD_DEFAULT,
  style,
  className,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const [pullY, setPullY] = useState(0);       // 0-MAX_PULL, drives indicator height
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);          // avoid stale closure in event handlers

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshingRef.current) return;
    const el = containerRef.current;
    // Only start tracking if already at top of scroll
    if (el && el.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === null || refreshingRef.current) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) {
      // Scrolling up — cancel tracking
      startYRef.current = null;
      setPullY(0);
      return;
    }
    // Apply rubber-band damping: progress slows as it approaches MAX_PULL
    const damped = Math.min(delta * 0.45, MAX_PULL);
    setPullY(damped);
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (startYRef.current === null || refreshingRef.current) return;
    startYRef.current = null;

    if (pullY >= threshold) {
      refreshingRef.current = true;
      setRefreshing(true);
      setPullY(48); // hold indicator open while loading
      try {
        await onRefresh();
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
  }, [pullY, threshold, onRefresh]);

  const indicatorHeight = refreshing ? 48 : pullY > 0 ? Math.min(pullY, 48) : 0;
  const showArrow = !refreshing && pullY >= threshold;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overflowY: 'auto', ...style }}
      className={className}
    >
      {/* Pull indicator */}
      <div
        className={`ptr-indicator${indicatorHeight === 0 ? ' collapsed' : ''}`}
        style={{ height: indicatorHeight }}
        aria-hidden="true"
      >
        {refreshing ? (
          <span className="ptr-spinner" />
        ) : showArrow ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-faint)', transform: `rotate(${(pullY / threshold) * 180}deg)`, transition: 'transform 0.1s ease' }}>
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        )}
        {refreshing && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent)' }}>Refreshing…</span>}
      </div>

      {children}
    </div>
  );
}

'use client';

import React from 'react';

interface StreakWidgetProps {
  current: number;
  longest: number;
  totalPoints: number;
  weeklyActivity: boolean[];
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function StreakWidget({ current, longest, totalPoints, weeklyActivity }: StreakWidgetProps) {
  const active = current > 0;

  return (
    <div
      style={{
        margin: 'var(--space-3) var(--space-4) 0',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-5)',
      }}
    >
      <style>{`
        @keyframes flame-pulse {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          50% { transform: scaleY(1.06) scaleX(0.97); }
        }
      `}</style>

      {/* Flame + count */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          minWidth: 56,
        }}
      >
        <svg
          width="36"
          height="44"
          viewBox="0 0 36 44"
          fill="none"
          style={active ? { animation: 'flame-pulse 1.8s ease-in-out infinite' } : {}}
          aria-hidden="true"
        >
          <path
            d="M18 2C14 10 8 17 8 26C8 35 12 42 18 42C24 42 28 35 28 26C28 17 22 10 18 2Z"
            fill={active ? 'var(--color-accent)' : 'var(--color-border)'}
          />
          <path
            d="M18 28C15.8 28 14 26.2 14 24C14 21.5 15.5 19.5 18 17C20.5 19.5 22 21.5 22 24C22 26.2 20.2 28 18 28Z"
            fill={active ? 'var(--color-orange-sharp, #f7bd95)' : 'var(--color-surface)'}
          />
        </svg>

        <span
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            lineHeight: 1,
            color: active ? 'var(--color-text)' : 'var(--color-text-faint)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {current}
        </span>
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
          }}
        >
          {active ? 'day streak' : 'Start today'}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--color-border)', flexShrink: 0 }} />

      {/* Weekly dots + stats */}
      <div style={{ flex: 1 }}>
        {/* Weekly circles */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            justifyContent: 'center',
            marginBottom: 'var(--space-3)',
          }}
        >
          {DAY_LABELS.map((label, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 'var(--radius-full)',
                  background: weeklyActivity[i] ? 'var(--color-accent)' : 'var(--color-bg)',
                  border: `1.5px solid ${weeklyActivity[i] ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
              >
                {weeklyActivity[i] && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: '0.6rem', color: 'var(--color-text-faint)', fontWeight: 500 }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                margin: 0,
                fontSize: 'var(--font-size-sm)',
                fontWeight: 700,
                color: 'var(--color-text)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {longest}
            </p>
            <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              best
            </p>
          </div>
          <div style={{ width: 1, background: 'var(--color-border)' }} />
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                margin: 0,
                fontSize: 'var(--font-size-sm)',
                fontWeight: 700,
                color: 'var(--color-accent)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {totalPoints}
            </p>
            <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              pts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

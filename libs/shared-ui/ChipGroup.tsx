'use client';

import React from 'react';

interface ChipGroupProps {
  options: string[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  mode?: 'single' | 'multi';
  scrollable?: boolean;
  softActive?: boolean;
}

export function ChipGroup({
  options,
  value,
  onChange,
  mode = 'single',
  scrollable = false,
  softActive = false,
}: ChipGroupProps) {
  const isActive = (option: string) =>
    Array.isArray(value) ? value.includes(option) : value === option;

  const handleClick = (option: string) => {
    if (mode === 'multi') {
      const arr = Array.isArray(value) ? value : [];
      const next = arr.includes(option)
        ? arr.filter((v) => v !== option)
        : [...arr, option];
      onChange(next);
    } else {
      onChange(option);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: scrollable ? 'nowrap' : 'wrap',
        overflowX: scrollable ? 'auto' : 'visible',
        scrollbarWidth: 'none',
        gap: 'var(--space-2)',
        paddingBottom: scrollable ? 'var(--space-1)' : 0,
      }}
    >
      {options.map((option) => {
        const active = isActive(option);
        return (
          <button
            key={option}
            onClick={() => handleClick(option)}
            style={{
              flexShrink: 0,
              padding: `var(--space-2) var(--space-3)`,
              borderRadius: 'var(--radius-full)',
              border: active
                ? softActive
                  ? '1px solid var(--color-accent)'
                  : '1px solid var(--color-accent)'
                : '1px solid var(--color-border)',
              background: active
                ? softActive
                  ? 'var(--color-accent-chip)'
                  : 'var(--color-accent)'
                : 'transparent',
              color: active
                ? softActive
                  ? 'var(--color-accent)'
                  : 'var(--color-text-inverse)'
                : 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: active
                ? ('var(--font-weight-semibold)' as React.CSSProperties['fontWeight'])
                : ('var(--font-weight-regular)' as React.CSSProperties['fontWeight']),
              cursor: 'pointer',
              transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

'use client';

import React from 'react';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabBarProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pill';
}

export function TabBar({ tabs, activeId, onChange, variant = 'underline' }: TabBarProps) {
  if (variant === 'pill') {
    return (
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-1)',
          background: 'var(--color-bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-1)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                flex: 1,
                padding: `var(--space-2) var(--space-3)`,
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                fontWeight: (isActive
                  ? 'var(--font-weight-semibold)'
                  : 'var(--font-weight-regular)') as React.CSSProperties['fontWeight'],
                background: isActive ? 'var(--color-accent)' : 'transparent',
                color: isActive ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
                transition: 'background 0.15s ease, color 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  // underline variant
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        padding: `0 var(--space-4)`,
        gap: 'var(--space-2)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-1)',
              flex: 1,
              padding: `var(--space-3) var(--space-2)`,
              border: 'none',
              borderBottom: isActive
                ? '2px solid var(--color-accent)'
                : '2px solid transparent',
              marginBottom: -1,
              background: 'none',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontWeight: (isActive
                ? 'var(--font-weight-semibold)'
                : 'var(--font-weight-regular)') as React.CSSProperties['fontWeight'],
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
              transition: 'color 0.15s ease, border-color 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.icon && <span style={{ transition: 'color 0.15s ease' }}>{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

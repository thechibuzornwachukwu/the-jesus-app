'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Flame } from 'lucide-react';

const ROUTE_TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: '/explore',  title: 'The JESUS App' },
  { prefix: '/discover', title: 'Discover'       },
  { prefix: '/testify',  title: 'Testify'        },
  { prefix: '/engage',   title: 'Communities'    },
  { prefix: '/learn',    title: 'Learn'          },
  { prefix: '/chat',     title: 'Messages'       },
  { prefix: '/profile',  title: 'Profile'        },
];

function getTitle(pathname: string): string {
  const match = ROUTE_TITLES.find(({ prefix }) => pathname === prefix || pathname.startsWith(prefix + '/'));
  return match?.title ?? 'The JESUS App';
}

interface AppHeaderProps {
  streakCount: number;
}

export function AppHeader({ streakCount }: AppHeaderProps) {
  const pathname = usePathname();
  const title = getTitle(pathname);
  const isExploreFeed = pathname === '/explore';
  const hasOwnHeader = isExploreFeed || pathname.startsWith('/chat');

  if (hasOwnHeader) return null;

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        height: 'var(--header-height)',
        paddingTop: 'var(--safe-top, 0px)',
        zIndex: 'var(--z-header)',
        backgroundColor: isExploreFeed ? 'transparent' : 'var(--color-bg-surface)',
        borderBottom: isExploreFeed ? '1px solid transparent' : '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 'var(--space-4)',
        paddingRight: 'var(--space-3)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transition: 'background-color 0.3s, border-color 0.3s',
      } as React.CSSProperties}
    >
      {/* Wordmark / page title */}
      <span
        style={{
          fontFamily: 'var(--font-display, "Archivo Condensed", sans-serif)',
          fontWeight: 800,
          fontSize: '1.1rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-text)',
        }}
      >
        {title}
      </span>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {/* Streak */}
        <div
          title={`${streakCount}-day streak`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            color: streakCount > 0 ? 'var(--color-accent)' : 'var(--color-text-faint)',
            fontSize: '0.8rem',
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          <Flame size={16} strokeWidth={1.5} fill={streakCount > 0 ? 'currentColor' : 'none'} aria-hidden />
          <span>{streakCount}</span>
        </div>
      </div>
    </header>
  );
}

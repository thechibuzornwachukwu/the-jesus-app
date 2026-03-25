'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, Compass, Zap, User } from 'lucide-react';
import { vibrate } from '../libs/shared-ui/haptics';

const navItems = [
  { href: '/explore',  label: 'Experience', Icon: Globe },
  { href: '/discover', label: 'Explore',    Icon: Compass },
  { href: '/learn',    label: 'Equip',      Icon: Zap },
  { href: '/profile',  label: 'Profile',    Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  function navigate(href: string) {
    vibrate([8]);
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void })
        .startViewTransition(() => router.push(href));
    } else {
      router.push(href);
    }
  }

  return (
    <>
      <style>{`
        @keyframes compassSpring {
          0%   { transform: rotate(0deg); }
          30%  { transform: rotate(56deg); }
          55%  { transform: rotate(36deg); }
          75%  { transform: rotate(49deg); }
          90%  { transform: rotate(43deg); }
          100% { transform: rotate(45deg); }
        }
        .compass-spring {
          display: inline-flex;
          animation: compassSpring 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    <nav
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        height: 'calc(var(--nav-height) + var(--safe-bottom))',
        paddingBottom: 'var(--safe-bottom)',
        zIndex: 'var(--z-nav)',
        backgroundColor: 'var(--color-bg-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'flex-start',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {navItems.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href) ||
          (href === '/learn' && pathname.startsWith('/library'));
        return (
          <button
            key={href}
            onClick={() => navigate(href)}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
              paddingTop: 'var(--space-2)',
              paddingBottom: 'var(--space-2)',
              height: 'var(--nav-height)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
              transition: 'color 0.15s, transform 0.1s',
              WebkitTapHighlightColor: 'transparent',
              transform: 'scale(1)',
            } as React.CSSProperties}
            onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)'; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            onTouchStart={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)'; }}
            onTouchEnd={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            <span className={Icon === Compass && active ? 'compass-spring' : undefined}>
              <Icon
                size={22}
                strokeWidth={1.5}
                fill={active ? 'currentColor' : 'none'}
                aria-hidden
              />
            </span>
            <span style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
    </>
  );
}

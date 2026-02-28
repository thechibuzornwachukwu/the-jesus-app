'use client';

import { usePathname, useRouter } from 'next/navigation';
import { MessageSquare, BookOpen, Compass, User } from 'lucide-react';
import { vibrate } from '../libs/shared-ui/haptics';

const navItems = [
  { href: '/engage',  label: 'Engage',  Icon: MessageSquare },
  { href: '/learn',   label: 'Learn',   Icon: BookOpen },
  { href: '/explore', label: 'Explore', Icon: Compass },
  { href: '/profile', label: 'Profile', Icon: User },
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
        const active = pathname.startsWith(href);
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
              active: undefined,
            } as React.CSSProperties}
            onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)'; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            onTouchStart={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)'; }}
            onTouchEnd={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            <Icon
              size={22}
              strokeWidth={1.5}
              fill={active ? 'currentColor' : 'none'}
              aria-hidden
            />
            <span style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

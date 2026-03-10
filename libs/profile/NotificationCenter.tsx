'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '../shared-ui/Avatar';
import { Button } from '../shared-ui/Button';
import { FullScreenModal, EmptyState } from '../shared-ui';
import type { AppNotification } from './types';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAll: () => void;
  onMarkRead: (id: string) => void;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function describe(n: AppNotification): string {
  const actor = n.actor?.username ?? 'Someone';
  if (n.type === 'like') return `${actor} liked your video`;
  if (n.type === 'comment') {
    const preview = (n.payload.preview as string) ?? '';
    return `${actor} commented: "${preview}"`;
  }
  if (n.type === 'mention') {
    const preview = (n.payload.preview as string) ?? '';
    return `${actor} mentioned you: "${preview}"`;
  }
  if (n.type === 'follow') return `@${actor} started following you`;
  return `${actor} interacted with you`;
}

function getNavTarget(n: AppNotification): string | null {
  if (n.type === 'follow') {
    const username = (n.payload.follower_username as string) ?? n.actor?.username;
    return username ? `/profile/${username}` : null;
  }
  return null;
}

export function NotificationCenter({
  open,
  onClose,
  notifications,
  onMarkAll,
  onMarkRead,
}: NotificationCenterProps) {
  const router = useRouter();

  const markAllAction = notifications.some((n) => !n.is_read) ? (
    <Button
      variant="ghost"
      onClick={onMarkAll}
      style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-2)' }}
    >
      Mark all read
    </Button>
  ) : undefined;

  return (
    <FullScreenModal open={open} onClose={onClose} title="Notifications" action={markAllAction}>
      {notifications.length === 0 ? (
        <EmptyState message="No notifications yet." />
      ) : (
        notifications.map((n) => {
          const navTarget = getNavTarget(n);
          return (
          <button
            key={n.id}
            onClick={() => {
              if (!n.is_read) onMarkRead(n.id);
              if (navTarget) { onClose(); router.push(navTarget); }
            }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              width: '100%',
              background: n.is_read ? 'transparent' : 'var(--color-accent-wash)',
              border: 'none',
              borderBottom: '1px solid var(--color-border)',
              cursor: (navTarget || !n.is_read) ? 'pointer' : 'default',
              textAlign: 'left',
            }}
          >
            <Avatar src={n.actor?.avatar_url} name={n.actor?.username} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text)',
                  lineHeight: 'var(--line-height-normal)',
                }}
              >
                {describe(n)}
              </p>
              <p
                style={{
                  margin: 'var(--space-1) 0 0',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {relativeTime(n.created_at)}
              </p>
            </div>
            {!n.is_read && (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-accent)',
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />
            )}
          </button>
          );
        })
      )}
    </FullScreenModal>
  );
}

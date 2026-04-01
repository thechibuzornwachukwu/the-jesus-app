'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell } from 'lucide-react';
import { EmptyState } from '../../../../../libs/shared-ui/EmptyState';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../../../../lib/profile/actions';
import type { AppNotification } from '../../../../../libs/profile/types';
import { Avatar } from '../../../../../libs/shared-ui/Avatar';

export function NotificationsPageClient() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications().then((data) => {
      setNotifications(data);
      setLoading(false);
    });
  }, []);

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={{ minHeight: '100%', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'calc(var(--safe-top) + var(--space-3)) var(--space-4) var(--space-3)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={() => router.back()}
            aria-label="Back"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', padding: 'var(--space-1)' }}
          >
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
            Notifications
          </h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-accent)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>
        {loading ? (
          <div style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState icon={<Bell size={32} />} message="You're all caught up." />
        ) : (
          <div>
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => { if (!n.is_read) handleMarkRead(n.id); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: n.is_read ? 'none' : 'var(--color-accent-soft)',
                  border: 'none',
                  borderBottom: '1px solid var(--color-border)',
                  cursor: n.is_read ? 'default' : 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
              >
                <Avatar
                  src={n.actor?.avatar_url ?? null}
                  name={n.actor?.username ?? '?'}
                  size={36}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', lineHeight: 'var(--line-height-normal)' }}>
                    <strong>{n.actor?.username ?? 'Someone'}</strong>{' '}
                    {n.type === 'like' && 'liked your post'}
                    {n.type === 'comment' && 'commented on your post'}
                    {n.type === 'follow' && 'followed you'}
                    {n.type === 'mention' && 'mentioned you'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-faint)' }}>
                    {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!n.is_read && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-accent)',
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

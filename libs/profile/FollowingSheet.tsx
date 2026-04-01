'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { Avatar } from '../shared-ui/Avatar';
import { Skeleton } from '../shared-ui/Skeleton';
import { getFollowing } from '../../lib/follow/actions';

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function FollowingSheet({ open, onClose, userId }: Props) {
  const router = useRouter();
  const [people, setPeople] = useState<{ id: string; username: string; avatar_url: string | null }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getFollowing(userId).then((data) => { setPeople(data); setLoading(false); });
  }, [open, userId]);

  return (
    <BottomSheet open={open} onClose={onClose} title="Following">
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 80 }}>
        {loading && [...Array(4)].map((_, i) => (
          <Skeleton key={i} style={{ height: 52, borderRadius: 'var(--radius-md)', marginBottom: 8 }} />
        ))}
        {!loading && people.length === 0 && (
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', padding: 'var(--space-6) 0' }}>
            Not following anyone yet
          </p>
        )}
        {!loading && people.map((p) => (
          <button
            key={p.id}
            onClick={() => { onClose(); router.push(`/profile/${p.username}`); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid var(--color-border)',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Avatar src={p.avatar_url} name={p.username} size={40} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
              @{p.username}
            </p>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

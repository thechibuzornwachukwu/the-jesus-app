'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { UserCard } from './UserCard';
import { getFollowersList } from '../../lib/profile/actions';
import type { ProfileSummary } from './types';

interface FollowersSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  title?: string;
}

export function FollowersSheet({ open, onClose, userId, title = 'Followers' }: FollowersSheetProps) {
  const [users, setUsers] = useState<ProfileSummary[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = useCallback(async (p: number) => {
    setLoading(true);
    const data = await getFollowersList(userId, p);
    if (p === 0) {
      setUsers(data);
    } else {
      setUsers((prev) => [...prev, ...data]);
    }
    setHasMore(data.length === 20);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (open) {
      setPage(0);
      setHasMore(true);
      loadPage(0);
    } else {
      setUsers([]);
    }
  }, [open, loadPage]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    loadPage(next);
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={title} contentScrollable>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', paddingBottom: 'var(--space-6)' }}>
        {users.length === 0 && !loading && (
          <p
            style={{
              textAlign: 'center',
              color: 'var(--color-text-faint)',
              fontSize: 'var(--font-size-sm)',
              padding: 'var(--space-8) 0',
            }}
          >
            No followers yet.
          </p>
        )}

        {users.map((u) => (
          <UserCard key={u.id} user={u} />
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4)' }}>
            <Loader2 size={20} style={{ color: 'var(--color-text-faint)', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {!loading && hasMore && users.length > 0 && (
          <button
            onClick={loadMore}
            style={{
              marginTop: 'var(--space-2)',
              padding: 'var(--space-3)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Load more
          </button>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </BottomSheet>
  );
}

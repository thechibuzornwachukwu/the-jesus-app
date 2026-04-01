'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomSheet } from './BottomSheet';
import { Avatar } from './Avatar';
import { Skeleton } from './Skeleton';
import { getPublicProfileById } from '../../lib/profile/actions';
import type { PublicProfile } from '../profile/types';

interface UserProfileSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}

export function UserProfileSheet({ open, onClose, userId }: UserProfileSheetProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) { setProfile(null); return; }
    setLoading(true);
    getPublicProfileById(userId).then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, [open, userId]);

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minHeight: 160 }}>
        {loading && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Skeleton style={{ width: 56, height: 56, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <Skeleton style={{ height: 16, width: 120, borderRadius: 4, marginBottom: 6 }} />
                <Skeleton style={{ height: 12, width: 80, borderRadius: 4 }} />
              </div>
            </div>
            <Skeleton style={{ height: 36, borderRadius: 'var(--radius-full)' }} />
          </>
        )}

        {!loading && profile && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar src={profile.avatar_url} name={profile.username} size={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  @{profile.username}
                </p>
                {profile.bio && (
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile.bio}
                  </p>
                )}
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-faint)' }}>
                  {profile.follower_count} followers · {profile.following_count} following
                </p>
              </div>
            </div>

            <button
              onClick={() => { onClose(); router.push(`/profile/${profile.username}`); }}
              style={{
                width: '100%',
                padding: '11px 0',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: 'var(--color-accent)',
                color: 'var(--color-accent-text)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              View Profile
            </button>
          </>
        )}

        {!loading && !profile && (
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', padding: 'var(--space-6) 0' }}>
            Profile not found.
          </p>
        )}
      </div>
    </BottomSheet>
  );
}

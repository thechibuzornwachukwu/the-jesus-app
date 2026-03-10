'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Building, ArrowRight } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { getPublicProfileById, followUser, unfollowUser } from '../../lib/profile/actions';
import type { PublicProfile } from '../../libs/profile/types';

interface UserProfileSheetProps {
  open: boolean;
  onClose: () => void;
  /** UUID of the user whose profile to show */
  userId: string | null;
  /** If provided, skip the server fetch and use this data directly */
  initialProfile?: PublicProfile;
}

export function UserProfileSheet({
  open,
  onClose,
  userId,
  initialProfile,
}: UserProfileSheetProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(initialProfile ?? null);
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialProfile?.is_following ?? false);
  const [followerCount, setFollowerCount] = useState(initialProfile?.follower_count ?? 0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !userId) {
      setProfile(null);
      return;
    }
    setLoading(true);
    getPublicProfileById(userId).then((p) => {
      setProfile(p);
      setIsFollowing(p?.is_following ?? false);
      setFollowerCount(p?.follower_count ?? 0);
      setLoading(false);
    });
  }, [open, userId]);

  const handleFollow = () => {
    if (!profile) return;
    const willFollow = !isFollowing;
    setIsFollowing(willFollow);
    setFollowerCount((c) => c + (willFollow ? 1 : -1));
    startTransition(async () => {
      if (willFollow) {
        await followUser(profile.id);
      } else {
        await unfollowUser(profile.id);
      }
    });
  };

  const handleViewProfile = () => {
    if (!profile) return;
    onClose();
    router.push(`/profile/${profile.username}`);
  };

  return (
    <BottomSheet open={open} onClose={onClose} contentScrollable={false}>
      <div style={{ padding: '0 var(--space-2) var(--space-4)' }}>
        {loading || !profile ? (
          /* ── Skeleton state ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <Skeleton w={64} h={64} radius="50%" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton w="55%" h={16} />
                <Skeleton w="40%" h={13} />
              </div>
            </div>
            <Skeleton w="100%" h={13} />
            <Skeleton w="75%" h={13} />
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <Skeleton w="50%" h={40} radius="var(--radius-full)" />
              <Skeleton w="50%" h={40} radius="var(--radius-full)" />
            </div>
          </div>
        ) : (
          <>
            {/* ── Avatar + counts row ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <Avatar src={profile.avatar_url} name={profile.username} size={64} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontWeight: 'var(--font-weight-bold)',
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--color-text)',
                    margin: '0 0 4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  @{profile.username}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text)',
                    }}
                  >
                    {followerCount}
                  </span>{' '}
                  followers ·{' '}
                  <span
                    style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text)',
                    }}
                  >
                    {profile.following_count}
                  </span>{' '}
                  following
                </p>
              </div>
            </div>

            {/* ── Bio ── */}
            {profile.bio && (
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-3)',
                  lineHeight: 'var(--line-height-normal)',
                }}
              >
                {profile.bio}
              </p>
            )}

            {/* ── Church / City ── */}
            {(profile.church_name || profile.city) && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                {profile.church_name && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <Building size={12} />
                    {profile.church_name}
                  </span>
                )}
                {profile.city && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <MapPin size={12} />
                    {profile.city}
                  </span>
                )}
              </div>
            )}

            {/* ── Action buttons ── */}
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Button
                variant={isFollowing ? 'ghost' : 'primary'}
                onClick={handleFollow}
                style={{ flex: 1 }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button
                variant="ghost"
                onClick={handleViewProfile}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                Full profile
                <ArrowRight size={14} />
              </Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

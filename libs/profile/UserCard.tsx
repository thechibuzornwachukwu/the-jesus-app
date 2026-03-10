'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Church } from 'lucide-react';
import { Avatar } from '../shared-ui/Avatar';
import { vibrate } from '../shared-ui/haptics';
import { followUser, unfollowUser } from '../../lib/profile/actions';
import type { ProfileSummary } from './types';

interface UserCardProps {
  user: ProfileSummary;
}

export function UserCard({ user }: UserCardProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(user.is_following);
  const [followerCount, setFollowerCount] = useState(user.follower_count);
  const [isPending, startTransition] = useTransition();

  const handleFollowToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate([8]);
    const next = !following;
    setFollowing(next);
    setFollowerCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const { error } = next
        ? await followUser(user.id)
        : await unfollowUser(user.id);
      if (error) {
        // revert on error
        setFollowing(!next);
        setFollowerCount((c) => c + (next ? -1 : 1));
      }
    });
  };

  const handleCardClick = () => {
    vibrate([8]);
    router.push(`/profile/${user.username}`);
  };

  const subtitle = [user.city, user.church_name].filter(Boolean).join(' · ');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        border: '1px solid var(--color-border)',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-high)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface)'; }}
    >
      {/* Avatar */}
      <div style={{ flexShrink: 0 }}>
        <Avatar src={user.avatar_url} name={user.username} size={48} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          @{user.username}
        </p>

        {user.bio && (
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 12,
              color: 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user.bio}
          </p>
        )}

        {subtitle && (
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 11,
              color: 'var(--color-text-faint)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user.city && <MapPin size={10} aria-hidden />}
            {user.church_name && !user.city && <Church size={10} aria-hidden />}
            {subtitle}
          </p>
        )}

        <p
          style={{
            margin: '3px 0 0',
            fontSize: 11,
            color: 'var(--color-text-faint)',
          }}
        >
          {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
        </p>
      </div>

      {/* Follow / Unfollow */}
      <button
        onClick={handleFollowToggle}
        disabled={isPending}
        style={{
          flexShrink: 0,
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          border: following ? '1px solid var(--color-border)' : 'none',
          background: following ? 'transparent' : 'var(--color-accent)',
          color: following ? 'var(--color-text-muted)' : 'var(--color-accent-text)',
          fontSize: 13,
          fontWeight: 600,
          cursor: isPending ? 'default' : 'pointer',
          opacity: isPending ? 0.6 : 1,
          transition: 'background 0.15s, opacity 0.15s',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}

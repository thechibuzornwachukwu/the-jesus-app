'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Avatar } from '../shared-ui/Avatar';
import { Skeleton } from '../shared-ui/Skeleton';
import { vibrate } from '../shared-ui/haptics';
import { followUser, unfollowUser } from '../../lib/profile/actions';
import type { ProfileSummary } from '../profile/types';

interface PeopleRowProps {
  people: ProfileSummary[];
  loading?: boolean;
  onSeeAll?: () => void;
}

function MiniUserCard({ user }: { user: ProfileSummary }) {
  const router = useRouter();
  const [following, setFollowing] = useState(user.is_following);
  const [isPending, startTransition] = useTransition();

  function handleCardClick() {
    vibrate([8]);
    router.push(`/profile/${user.username}`);
  }

  function handleFollow(e: React.MouseEvent) {
    e.stopPropagation();
    vibrate([8]);
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const { error } = next ? await followUser(user.id) : await unfollowUser(user.id);
      if (error) setFollowing(!next);
    });
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
      style={{
        flexShrink: 0,
        width: 120,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '12px 8px',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        cursor: 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-high)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface)'; }}
    >
      <Avatar src={user.avatar_url} name={user.username} size={48} />

      <div style={{ textAlign: 'center', width: '100%' }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          @{user.username}
        </p>
        {user.bio && (
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 11,
              color: 'var(--color-text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
            } as React.CSSProperties}
          >
            {user.bio}
          </p>
        )}
      </div>

      <button
        onClick={handleFollow}
        disabled={isPending}
        style={{
          width: '100%',
          padding: '5px 0',
          borderRadius: 'var(--radius-full)',
          border: following ? '1px solid var(--color-border)' : 'none',
          background: following ? 'transparent' : 'var(--color-accent)',
          color: following ? 'var(--color-text-muted)' : 'var(--color-accent-text)',
          fontSize: 12,
          fontWeight: 700,
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

export function PeopleRow({ people, loading, onSeeAll }: PeopleRowProps) {
  return (
    <section>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-4)',
          marginBottom: 'var(--space-2)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          People
        </p>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-accent)',
              fontSize: 13,
              fontWeight: 600,
              padding: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            See all <ChevronRight size={14} strokeWidth={2.5} aria-hidden />
          </button>
        )}
      </div>

      {/* Scroll row */}
      <div
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingLeft: 'var(--space-4)',
          paddingRight: 'var(--space-4)',
          paddingBottom: 4,
        }}
      >
        {loading
          ? [...Array(5)].map((_, i) => (
              <Skeleton key={i} style={{ height: 160, width: 120, borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
            ))
          : people.map((u) => <MiniUserCard key={u.id} user={u} />)}
      </div>
    </section>
  );
}

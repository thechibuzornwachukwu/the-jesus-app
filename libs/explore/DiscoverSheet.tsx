'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { Avatar } from '../shared-ui/Avatar';
import { Button } from '../shared-ui/Button';
import type { ProfileSummary } from '../profile/types';
import {
  searchUsers,
  getSuggestedUsers,
  followUser,
  unfollowUser,
} from '../../lib/profile/actions';

interface DiscoverSheetProps {
  open: boolean;
  onClose: () => void;
}

export function DiscoverSheet({ open, onClose }: DiscoverSheetProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProfileSummary[]>([]);
  const [suggested, setSuggested] = useState<ProfileSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [followState, setFollowState] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load suggestions when sheet opens — always re-fetch for fresh is_following values
  useEffect(() => {
    if (open) {
      getSuggestedUsers(20).then(setSuggested);
      setTimeout(() => inputRef.current?.focus(), 120);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const r = await searchUsers(query.trim());
      setResults(r);
      setLoading(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function getIsFollowing(user: ProfileSummary) {
    return followState[user.id] !== undefined ? followState[user.id] : user.is_following;
  }

  function handleFollow(e: React.MouseEvent, user: ProfileSummary) {
    e.stopPropagation();
    const currently = getIsFollowing(user);
    const next = !currently;
    // Update overlay state
    setFollowState((s) => ({ ...s, [user.id]: next }));
    // Mutate in-place so list stays consistent during this session
    const patch = (list: ProfileSummary[]) =>
      list.map((u) => (u.id === user.id ? { ...u, is_following: next } : u));
    setSuggested((prev) => patch(prev));
    setResults((prev) => patch(prev));
    startTransition(async () => {
      if (currently) {
        await unfollowUser(user.id);
      } else {
        await followUser(user.id);
      }
    });
  }

  function handleRowClick(user: ProfileSummary) {
    onClose();
    router.push(`/profile/id/${user.id}`);
  }

  const displayList = query.trim() ? results : suggested;
  const showEmpty = !loading && displayList.length === 0;

  return (
    <BottomSheet open={open} onClose={onClose} title="Discover People" contentScrollable={false}>
      {/* Search input */}
      <div style={{ padding: '0 var(--space-6) var(--space-3)' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or bio…"
            style={{
              width: '100%',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '10px 12px 10px 36px',
              color: 'var(--color-text)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Section label */}
      {!query.trim() && (
        <p
          style={{
            margin: '0 var(--space-6) var(--space-2)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Suggested for you
        </p>
      )}

      {/* Results list */}
      <div
        style={{
          overflowY: 'auto',
          flex: 1,
          maxHeight: '60dvh',
          padding: '0 var(--space-6)',
          paddingBottom: 'calc(var(--safe-bottom, 0px) + var(--space-4))',
        }}
      >
        {loading && (
          <div
            style={{
              padding: 'var(--space-6)',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            Searching…
          </div>
        )}

        {!loading && showEmpty && query.trim() && (
          <div
            style={{
              padding: 'var(--space-6)',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {!loading && showEmpty && !query.trim() && (
          <div
            style={{
              padding: 'var(--space-6)',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            No suggestions yet
          </div>
        )}

        {!loading &&
          displayList.map((user) => {
            const following = getIsFollowing(user);
            const subtitle = [user.city, user.church_name].filter(Boolean).join(' · ');
            return (
              <div
                key={user.id}
                onClick={() => handleRowClick(user)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) 0',
                  borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Avatar */}
                <Avatar src={user.avatar_url} name={user.username} size={44} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    @{user.username}
                  </p>
                  {subtitle ? (
                    <>
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {subtitle}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-faint)',
                        }}
                      >
                        {user.follower_count} followers
                      </p>
                    </>
                  ) : (
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {user.follower_count} followers
                    </p>
                  )}
                </div>

                {/* Follow button */}
                <Button
                  variant={following ? 'ghost' : 'primary'}
                  onClick={(e) => handleFollow(e, user)}
                  className="text-[length:var(--font-size-xs)] px-[var(--space-4)] py-[var(--space-2)]"
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {following ? 'Following' : 'Follow'}
                </Button>
              </div>
            );
          })}
      </div>
    </BottomSheet>
  );
}

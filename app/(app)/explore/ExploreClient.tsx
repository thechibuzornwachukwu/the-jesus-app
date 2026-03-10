'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FeedItem } from '../../../lib/explore/types';
import { PerspectiveFeed, type PerspectiveFeedHandle } from '../../../libs/explore/PerspectiveFeed';
import { CommentSheet } from '../../../libs/explore/CommentSheet';
import { ComposeSheet } from '../../../libs/explore/ComposeSheet';
import { showToast } from '../../../libs/shared-ui/Toast';
import { EmptyState } from '../../../libs/shared-ui';
import { Users, Microscope, Plus, X } from 'lucide-react';
import { getFollowingFeed } from '../../../lib/explore/actions';

const FEED_HEIGHT = `calc(100dvh - var(--safe-top) - var(--nav-height) - var(--safe-bottom))`;

const TAB_OPTIONS = ['For Me', 'Friends'] as const;
type Tab = typeof TAB_OPTIONS[number];

interface ExploreClientProps {
  initialItems: FeedItem[];
  initialCursor: string | null;
  userId: string;
}

export function ExploreClient({ initialItems, initialCursor, userId }: ExploreClientProps) {
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('For Me');
  const [followingItems, setFollowingItems] = useState<FeedItem[]>([]);
  const [followingCursor, setFollowingCursor] = useState<string | null>(null);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const feedRef = useRef<PerspectiveFeedHandle>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadFollowingFeed = useCallback(async () => {
    if (followingLoaded) return;
    setFollowingLoading(true);
    try {
      const { items, nextCursor } = await getFollowingFeed();
      setFollowingItems(items);
      setFollowingCursor(nextCursor);
      setFollowingLoaded(true);
    } finally {
      setFollowingLoading(false);
    }
  }, [followingLoaded]);

  useEffect(() => {
    if (tab === 'Friends') {
      loadFollowingFeed();
    }
  }, [tab, loadFollowingFeed]);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    } else {
      setSearch('');
    }
  }, [searchOpen]);

  const handleUploaded = async (_id: string, _kind: 'video'): Promise<void> => {
    showToast('Perspective published!', 'success');
    setUploadOpen(false);
    feedRef.current?.refreshFeed();
  };

  const isForMe = tab === 'For Me';

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Transparent overlay bar ── */}
      <div
        style={{
          position: 'absolute',
          top: 'var(--safe-top, 0px)',
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          pointerEvents: 'none',
        }}
      >
        {/* Left spacer */}
        <div style={{ flex: 1 }} />

        {/* Center pill tab switcher */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.32)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 999,
            padding: '3px 4px',
            gap: 2,
          }}
        >
          {TAB_OPTIONS.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: active ? 'rgba(255,255,255,0.92)' : 'transparent',
                  border: 'none',
                  borderRadius: 999,
                  padding: '5px 16px',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: active ? 700 : 500,
                  color: active ? '#111' : 'rgba(255,255,255,0.82)',
                  textShadow: active ? 'none' : '0 1px 4px rgba(0,0,0,0.7)',
                  letterSpacing: '0.01em',
                  transition: 'background 0.18s, color 0.18s',
                  WebkitTapHighlightColor: 'transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Right actions */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 8, pointerEvents: 'auto' }}>
          <button
            aria-label="Search"
            onClick={() => setSearchOpen(o => !o)}
            style={{
              background: 'rgba(0,0,0,0.32)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: 'none',
              borderRadius: 999,
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.6))',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {searchOpen
              ? <X size={18} color="#fff" />
              : <Microscope size={18} color="#fff" />}
          </button>
          <button
            aria-label="Create post"
            onClick={() => setUploadOpen(true)}
            style={{
              background: 'var(--color-accent)',
              border: 'none',
              borderRadius: 999,
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              filter: 'drop-shadow(0 1px 6px rgba(244,117,33,0.55))',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Plus size={20} color="#fff" />
          </button>
        </div>
      </div>

      {/* ── Floating search bar (drops below overlay) ── */}
      {searchOpen && (
        <div
          style={{
            position: 'absolute',
            top: `calc(var(--safe-top, 0px) + 62px)`,
            left: 12,
            right: 12,
            zIndex: 9,
            pointerEvents: 'auto',
          }}
        >
          <input
            ref={searchInputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search perspectives…"
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 12,
              padding: '10px 16px',
              color: '#fff',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Friends: loading */}
      {!isForMe && followingLoading && (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
        }}>
          Loading…
        </div>
      )}

      {/* Friends: empty state */}
      {!isForMe && followingLoaded && followingItems.length === 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <EmptyState
            icon={<Users size={40} />}
            message="Follow people to see their perspectives here. Discover creators in the For Me feed!"
          />
        </div>
      )}

      {/* Feed */}
      {(isForMe || (followingLoaded && followingItems.length > 0)) && (
        <PerspectiveFeed
          key={tab}
          ref={isForMe ? feedRef : undefined}
          initialItems={isForMe ? initialItems : followingItems}
          initialCursor={isForMe ? initialCursor : followingCursor}
          userId={userId}
          feedHeight={FEED_HEIGHT}
          searchFilter={isForMe ? search : undefined}
          onComment={(id) => setCommentVideoId(id)}
          loadFeed={isForMe ? undefined : getFollowingFeed}
        />
      )}

      <CommentSheet videoId={commentVideoId} onClose={() => setCommentVideoId(null)} />
      <ComposeSheet open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={handleUploaded} />
    </div>
  );
}

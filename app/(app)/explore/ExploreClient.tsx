'use client';

import React, { useState, useRef } from 'react';
import type { FeedItem, DailyVerseType } from '../../../lib/explore/types';
import { DailyVerse } from '../../../libs/explore/DailyVerse';
import { PerspectiveFeed, type PerspectiveFeedHandle } from '../../../libs/explore/PerspectiveFeed';
import { CommentSheet } from '../../../libs/explore/CommentSheet';
import { UploadSheet } from '../../../libs/explore/UploadSheet';
import { showToast } from '../../../libs/shared-ui/Toast';
import { Plus, Search } from 'lucide-react';

const VERSE_BANNER_H = '56px';
const HEADER_H = '56px';
const FEED_HEIGHT = `calc(100dvh - var(--safe-top) - var(--nav-height) - var(--safe-bottom) - ${VERSE_BANNER_H} - ${HEADER_H})`;

interface ExploreClientProps {
  initialItems: FeedItem[];
  initialCursor: string | null;
  dailyVerse: DailyVerseType;
  userId: string;
}

const BTN: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 'var(--radius-full)',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

export function ExploreClient({ initialItems, initialCursor, dailyVerse, userId }: ExploreClientProps) {
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const feedRef = useRef<PerspectiveFeedHandle>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleUploaded = async (_id: string, _kind: 'video' | 'post' | 'image'): Promise<void> => {
    showToast('Perspective published!', 'success');
    setUploadOpen(false);
    feedRef.current?.refreshFeed();
  };

  const toggleSearch = () => {
    setSearchOpen((prev) => {
      if (!prev) setTimeout(() => searchInputRef.current?.focus(), 50);
      else setSearch('');
      return !prev;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Sticky 56px header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        height: HEADER_H, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        padding: '0 var(--space-4)', gap: 'var(--space-2)',
        background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)',
      }}>
        <h1 style={{
          fontFamily: "'Archivo Condensed', var(--font-display)",
          margin: 0, flex: 1,
          fontSize: 'var(--font-size-4xl)',
          fontWeight: 'var(--font-weight-black)' as React.CSSProperties['fontWeight'],
          letterSpacing: 'var(--letter-spacing-tight)',
          color: 'var(--color-text-primary)',
          lineHeight: 'var(--line-height-tight)',
        }}>
          Witness
        </h1>

        {/* Search button */}
        <button
          onClick={toggleSearch}
          aria-label="Search perspectives"
          style={{ ...BTN, background: searchOpen ? 'var(--color-accent)' : 'var(--color-surface)', color: searchOpen ? 'var(--color-accent-text)' : 'var(--color-text)' }}
        >
          <Search size={18} />
        </button>

        {/* Create button */}
        <button
          onClick={() => setUploadOpen(true)}
          aria-label="Share a perspective"
          style={{ ...BTN, background: 'var(--color-accent)', color: 'var(--color-accent-text)' }}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Inline search bar */}
      {searchOpen && (
        <div style={{ padding: 'var(--space-2) var(--space-4)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)', flexShrink: 0 }}>
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search perspectives…"
            className="field-input"
            style={{ borderRadius: 'var(--radius-full)', padding: 'var(--space-2) var(--space-4)', width: '100%' }}
          />
        </div>
      )}

      {/* Daily verse banner */}
      <div style={{ flexShrink: 0, height: VERSE_BANNER_H, overflow: 'hidden' }}>
        <DailyVerse verse={dailyVerse} initialLikeCount={0} initialUserLiked={false} initialCommentCount={0} />
      </div>

      {/* Unified feed */}
      <PerspectiveFeed
        ref={feedRef}
        initialItems={initialItems}
        initialCursor={initialCursor}
        userId={userId}
        feedHeight={FEED_HEIGHT}
        searchFilter={search}
        onComment={(id) => setCommentVideoId(id)}
      />

      <CommentSheet videoId={commentVideoId} onClose={() => setCommentVideoId(null)} />
      <UploadSheet open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={handleUploaded} />
    </div>
  );
}

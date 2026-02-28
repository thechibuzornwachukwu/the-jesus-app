'use client';

import React, { useState, useRef } from 'react';
import type { FeedItem } from '../../../lib/explore/types';
import type { DailyVerseType } from '../../../lib/explore/types';
import { DailyVerse } from '../../../libs/explore/DailyVerse';
import { PerspectiveFeed, type PerspectiveFeedHandle } from '../../../libs/explore/PerspectiveFeed';
import { CommentSheet } from '../../../libs/explore/CommentSheet';
import { UploadSheet } from '../../../libs/explore/UploadSheet';
import { showToast } from '../../../libs/shared-ui/Toast';
import { Plus } from 'lucide-react';

// Height of the daily verse banner (must match DailyVerse component)
const VERSE_BANNER_H = '56px';

// Feed height = full content area minus the verse banner
const FEED_HEIGHT = `calc(100dvh - var(--safe-top) - var(--nav-height) - var(--safe-bottom) - ${VERSE_BANNER_H})`;

interface ExploreClientProps {
  initialItems: FeedItem[];
  initialCursor: string | null;
  dailyVerse: DailyVerseType;
  userId: string;
}

export function ExploreClient({
  initialItems,
  initialCursor,
  dailyVerse,
  userId,
}: ExploreClientProps) {
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const feedRef = useRef<PerspectiveFeedHandle>(null);

  const handleUploaded = async (_id: string, _kind: 'video' | 'post') => {
    showToast('Perspective published!', 'success');
    setUploadOpen(false);
    await feedRef.current?.refreshFeed();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Daily verse banner — fixed height */}
      <div style={{ flexShrink: 0, height: VERSE_BANNER_H, overflow: 'hidden' }}>
        <DailyVerse verse={dailyVerse} />
      </div>

      {/* Unified feed */}
      <PerspectiveFeed
        ref={feedRef}
        initialItems={initialItems}
        initialCursor={initialCursor}
        userId={userId}
        feedHeight={FEED_HEIGHT}
        onComment={(id) => setCommentVideoId(id)}
      />

      {/* Create FAB — bottom-left */}
      <button
        onClick={() => setUploadOpen(true)}
        aria-label="Share a perspective"
        style={{
          position: 'fixed',
          left: 'var(--space-4)',
          bottom: `calc(var(--nav-height) + var(--safe-bottom) + var(--space-4))`,
          width: 52,
          height: 52,
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-accent)',
          color: 'var(--color-accent-text)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 'var(--z-overlay)' as React.CSSProperties['zIndex'],
        }}
      >
        <Plus size={24} />
      </button>

      {/* Sheets */}
      <CommentSheet videoId={commentVideoId} onClose={() => setCommentVideoId(null)} />
      <UploadSheet
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />
    </div>
  );
}

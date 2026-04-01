'use client';

import React, { useState, useRef } from 'react';
import type { FeedItem } from '../../../lib/explore/types';
import { PerspectiveFeed, type PerspectiveFeedHandle } from '../../../libs/explore/PerspectiveFeed';
import { CommentSheet } from '../../../libs/explore/CommentSheet';
import { ComposeSheet } from '../../../libs/explore/ComposeSheet';
import { DiscoverSheet } from '../../../libs/explore/DiscoverSheet';
import { showToast } from '../../../libs/shared-ui/Toast';
import { Search, Plus } from 'lucide-react';

const FEED_HEIGHT = `calc(100dvh - var(--safe-top) - var(--nav-height) - var(--safe-bottom))`;

interface ExploreClientProps {
  initialItems: FeedItem[];
  initialCursor: string | null;
  userId: string;
}

export function ExploreClient({ initialItems, initialCursor, userId }: ExploreClientProps) {
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const feedRef = useRef<PerspectiveFeedHandle>(null);

  const handleUploaded = async (_id: string, _kind: 'video'): Promise<void> => {
    showToast('Perspective published!', 'success');
    setUploadOpen(false);
    feedRef.current?.refreshFeed();
  };

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
          justifyContent: 'space-between',
          padding: '10px 12px',
          pointerEvents: 'none',
        }}
      >
        {/* Left: Create post */}
        <button
          aria-label="Create post"
          onClick={() => setUploadOpen(true)}
          style={{
            pointerEvents: 'auto',
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

        {/* Right: Discover */}
        <button
          aria-label="Discover people"
          onClick={() => setDiscoverOpen(true)}
          style={{
            pointerEvents: 'auto',
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
          <Search size={18} color="#fff" />
        </button>
      </div>

      {/* Feed */}
      <PerspectiveFeed
        ref={feedRef}
        initialItems={initialItems}
        initialCursor={initialCursor}
        userId={userId}
        feedHeight={FEED_HEIGHT}
        onComment={(id) => setCommentVideoId(id)}
      />

      <CommentSheet videoId={commentVideoId} onClose={() => setCommentVideoId(null)} />
      <ComposeSheet open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={handleUploaded} />
      <DiscoverSheet open={discoverOpen} onClose={() => setDiscoverOpen(false)} />
    </div>
  );
}

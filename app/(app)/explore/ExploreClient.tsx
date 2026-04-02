'use client';

import { useState, useRef, useEffect } from 'react';
import type { FeedItem } from '../../../lib/explore/types';
import { PerspectiveFeed, type PerspectiveFeedHandle } from '../../../libs/explore/PerspectiveFeed';
import { CommentSheet } from '../../../libs/explore/CommentSheet';
import { ComposeSheet } from '../../../libs/explore/ComposeSheet';
import { showToast } from '../../../libs/shared-ui/Toast';
import { Plus } from 'lucide-react';

interface ExploreClientProps {
  initialItems: FeedItem[];
  initialCursor: string | null;
  userId: string;
}

export function ExploreClient({ initialItems, initialCursor, userId }: ExploreClientProps) {
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const feedRef = useRef<PerspectiveFeedHandle>(null);

  // Strip padding from the shared <main> so the feed is truly full-bleed.
  // The outer div compensates with an explicit margin-top + height calc.
  useEffect(() => {
    const main = document.querySelector('main.page-content');
    main?.classList.add('page-content--fullscreen');
    return () => main?.classList.remove('page-content--fullscreen');
  }, []);

  const handleUploaded = async (_id: string, _kind: 'video'): Promise<void> => {
    showToast('Perspective published!', 'success');
    setUploadOpen(false);
    feedRef.current?.refreshFeed();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      marginTop: 'calc(var(--header-height) + var(--safe-top, 0px))',
      height: 'calc(100dvh - var(--header-height) - var(--nav-height) - var(--safe-top, 0px) - var(--safe-bottom, 0px))',
    }}>

      {/* Feed area */}
      <div style={{ flex: 1, position: 'relative' }}>

        {/* Create post FAB */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 12,
          zIndex: 10,
          pointerEvents: 'none',
        }}>
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
        </div>

        <PerspectiveFeed
          ref={feedRef}
          initialItems={initialItems}
          initialCursor={initialCursor}
          userId={userId}
          feedHeight="100%"
          onComment={(id) => setCommentVideoId(id)}
        />
      </div>

      <CommentSheet videoId={commentVideoId} onClose={() => setCommentVideoId(null)} />
      <ComposeSheet open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={handleUploaded} />
    </div>
  );
}

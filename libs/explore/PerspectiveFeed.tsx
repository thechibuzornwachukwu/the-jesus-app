'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Video as VideoIcon } from 'lucide-react';
import type { Video } from '../../lib/explore/types';
import { VideoCard } from './VideoCard';
import { getVideos } from '../../lib/explore/actions';
import { EmptyState } from '../shared-ui';

interface PerspectiveFeedProps {
  initialVideos: Video[];
  initialCursor: string | null;
  userId: string;
  feedHeight: string;
  onComment: (videoId: string) => void;
}

export function PerspectiveFeed({
  initialVideos,
  initialCursor,
  userId: _userId,
  feedHeight,
  onComment,
}: PerspectiveFeedProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const loadingRef = useRef(false);

  // IntersectionObserver: detect which card is ≥80% visible → set as active
  useEffect(() => {
    const cards = cardRefs.current;
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.8) {
            const idx = cards.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) {
              setActiveIndex(idx);
              // Trigger load more when 3 cards from end
              if (idx >= cards.length - 3) {
                loadMore();
              }
            }
          }
        });
      },
      { threshold: 0.8 }
    );

    cards.forEach((c) => { if (c) observer.observe(c); });
    return () => observer.disconnect();
  }, [videos]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !cursor) return;
    loadingRef.current = true;
    setLoadingMore(true);
    const { videos: newVids, nextCursor } = await getVideos(cursor);
    setVideos((prev) => [...prev, ...newVids]);
    setCursor(nextCursor);
    setLoadingMore(false);
    loadingRef.current = false;
  }, [cursor]);

  const handleLikeChanged = useCallback(
    (videoId: string, liked: boolean, likeCount: number) => {
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, user_liked: liked, like_count: likeCount } : v))
      );
    },
    []
  );

  if (videos.length === 0) {
    return (
      <div style={{ height: feedHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState message="No perspectives yet. Be the first to share one!" icon={<VideoIcon size={40} />} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        height: feedHeight,
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        // Hide scrollbar
        scrollbarWidth: 'none',
      }}
    >
      {videos.map((video, idx) => (
        <div
          key={video.id}
          ref={(el) => { cardRefs.current[idx] = el; }}
          style={{ height: feedHeight, scrollSnapAlign: 'start', flexShrink: 0 }}
        >
          <VideoCard
            video={video}
            isActive={activeIndex === idx}
            onComment={() => onComment(video.id)}
            onLikeChanged={handleLikeChanged}
            height={feedHeight}
          />
        </div>
      ))}

      {loadingMore && (
        <div
          style={{
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Loading…
        </div>
      )}
    </div>
  );
}

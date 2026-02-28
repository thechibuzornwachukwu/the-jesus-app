'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Video as VideoIcon } from 'lucide-react';
import type { FeedItem } from '../../lib/explore/types';
import { VideoCard } from './VideoCard';
import { TextPostCard } from './TextPostCard';
import { getUnifiedFeed } from '../../lib/explore/actions';
import { EmptyState } from '../shared-ui';

interface PerspectiveFeedProps {
  initialItems: FeedItem[];
  initialCursor: string | null;
  userId: string;
  feedHeight: string;
  onComment: (videoId: string) => void;
  pendingItem?: FeedItem | null;
}

export function PerspectiveFeed({
  initialItems,
  initialCursor,
  userId: _userId,
  feedHeight,
  onComment,
  pendingItem,
}: PerspectiveFeedProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);

  useEffect(() => {
    if (!pendingItem) return;
    setItems((prev) =>
      prev.some((i) => i.data.id === pendingItem.data.id) ? prev : [pendingItem, ...prev]
    );
  }, [pendingItem]);

  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const loadingRef = useRef(false);

  // IntersectionObserver: detect active card (≥80% visible)
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
              if (idx >= cards.length - 3) loadMore();
            }
          }
        });
      },
      { threshold: 0.8 }
    );

    cards.forEach((c) => { if (c) observer.observe(c); });
    return () => observer.disconnect();
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !cursor) return;
    loadingRef.current = true;
    setLoadingMore(true);
    const { items: newItems, nextCursor } = await getUnifiedFeed(cursor);
    setItems((prev) => [...prev, ...newItems]);
    setCursor(nextCursor);
    setLoadingMore(false);
    loadingRef.current = false;
  }, [cursor]);

  const handleVideoLikeChanged = useCallback(
    (videoId: string, liked: boolean, likeCount: number) => {
      setItems((prev) =>
        prev.map((item) =>
          item.kind === 'video' && item.data.id === videoId
            ? { ...item, data: { ...item.data, user_liked: liked, like_count: likeCount } }
            : item
        )
      );
    },
    []
  );

  const handlePostLikeChanged = useCallback(
    (postId: string, liked: boolean, likeCount: number) => {
      setItems((prev) =>
        prev.map((item) =>
          item.kind === 'post' && item.data.id === postId
            ? { ...item, data: { ...item.data, user_liked: liked, like_count: likeCount } }
            : item
        )
      );
    },
    []
  );

  if (items.length === 0) {
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
        scrollbarWidth: 'none',
      }}
    >
      {items.map((item, idx) => {
        if (item.kind === 'video') {
          return (
            <div
              key={item.data.id}
              ref={(el) => { cardRefs.current[idx] = el; }}
              style={{ height: feedHeight, scrollSnapAlign: 'start', flexShrink: 0 }}
            >
              <VideoCard
                video={item.data}
                isActive={activeIndex === idx}
                onComment={() => onComment(item.data.id)}
                onLikeChanged={handleVideoLikeChanged}
                height={feedHeight}
              />
            </div>
          );
        }

        // Text post — natural height, no full-screen snap
        return (
          <div
            key={item.data.id}
            ref={(el) => { cardRefs.current[idx] = el; }}
            style={{
              scrollSnapAlign: 'start',
              padding: 'var(--space-3) var(--space-4)',
            }}
          >
            <TextPostCard
              post={item.data}
              onLikeChanged={handlePostLikeChanged}
            />
          </div>
        );
      })}

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

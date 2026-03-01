'use client';

import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { Video as VideoIcon } from 'lucide-react';
import type { FeedItem, ReactionType } from '../../lib/explore/types';
import { VideoCard } from './VideoCard';
import { TextPostCard } from './TextPostCard';
import { ImageCard } from './ImageCard';
import { getUnifiedFeed } from '../../lib/explore/actions';
import { EmptyState } from '../shared-ui';

interface PerspectiveFeedProps {
  initialItems: FeedItem[];
  initialCursor: string | null;
  userId: string;
  feedHeight: string;
  onComment: (videoId: string) => void;
}

export interface PerspectiveFeedHandle {
  refreshFeed: () => void;
  prependItem: (item: FeedItem) => void;
}

export const PerspectiveFeed = forwardRef<PerspectiveFeedHandle, PerspectiveFeedProps>(
  function PerspectiveFeed(
    { initialItems, initialCursor, userId: _userId, feedHeight, onComment },
    ref
  ) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const loadingRef = useRef(false);

  const refreshFeed = useCallback(async () => {
    try {
      const { items: fresh, nextCursor } = await getUnifiedFeed();
      setItems(fresh);
      setCursor(nextCursor);
      setActiveIndex(0);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // silent — feed keeps showing existing items
    }
  }, []);

  const prependItem = useCallback((item: FeedItem) => {
    setItems((prev) => [item, ...prev]);
    setActiveIndex(0);
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useImperativeHandle(ref, () => ({ refreshFeed, prependItem }), [refreshFeed, prependItem]);

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

  const handleVideoReactionChanged = useCallback(
    (videoId: string, userReaction: ReactionType | null, counts: Record<ReactionType, number>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.kind === 'video' && item.data.id === videoId
            ? { ...item, data: { ...item.data, user_reaction: userReaction, reaction_counts: counts } }
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

  const handleImageLikeChanged = useCallback(
    (postId: string, liked: boolean, likeCount: number) => {
      setItems((prev) =>
        prev.map((item) =>
          item.kind === 'image' && item.data.id === postId
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
                onReactionChanged={handleVideoReactionChanged}
                height={feedHeight}
              />
            </div>
          );
        }

        if (item.kind === 'image') {
          return (
            <div
              key={item.data.id}
              ref={(el) => { cardRefs.current[idx] = el; }}
              style={{ height: feedHeight, scrollSnapAlign: 'start', flexShrink: 0 }}
            >
              <ImageCard
                post={item.data}
                height={feedHeight}
                onComment={() => onComment(item.data.id)}
                onLikeChanged={handleImageLikeChanged}
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
});

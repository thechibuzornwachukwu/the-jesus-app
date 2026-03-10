'use client';

import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { Video as VideoIcon } from 'lucide-react';
import type { FeedItem, ReactionType } from '../../lib/explore/types';
import { VideoCard } from './VideoCard';
import { getUnifiedFeed } from '../../lib/explore/actions';
import { EmptyState } from '../shared-ui';

interface PerspectiveFeedProps {
  initialItems: FeedItem[];
  initialCursor: string | null;
  userId: string;
  feedHeight: string;
  onComment: (videoId: string) => void;
  searchFilter?: string;
  loadFeed?: (cursor?: string) => Promise<{ items: FeedItem[]; nextCursor: string | null }>;
}

export interface PerspectiveFeedHandle {
  refreshFeed: () => void;
  prependItem: (item: FeedItem) => void;
}

export const PerspectiveFeed = forwardRef<PerspectiveFeedHandle, PerspectiveFeedProps>(
  function PerspectiveFeed(
    { initialItems, initialCursor, userId: _userId, feedHeight, onComment, searchFilter, loadFeed },
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
      const fetcher = loadFeed ?? getUnifiedFeed;
      const { items: fresh, nextCursor } = await fetcher();
      setItems(fresh);
      setCursor(nextCursor);
      setActiveIndex(0);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // silent  feed keeps showing existing items
    }
  }, [loadFeed]);

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
    const fetcher = loadFeed ?? getUnifiedFeed;
    const { items: newItems, nextCursor } = await fetcher(cursor);
    setItems((prev) => [...prev, ...newItems]);
    setCursor(nextCursor);
    setLoadingMore(false);
    loadingRef.current = false;
  }, [cursor, loadFeed]);

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

  const q = searchFilter?.trim().toLowerCase() ?? '';
  const videoItems = items.filter((item) => item.kind === 'video');
  const visibleItems = q
    ? videoItems.filter((item) => item.kind === 'video' && item.data.caption?.toLowerCase().includes(q))
    : videoItems;

  if (visibleItems.length === 0) {
    return (
      <div style={{ height: feedHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState message="No perspectives yet. Be the first to share one!" icon={<VideoIcon size={40} />} />
      </div>
    );
  }

  return (
    <>
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
      {visibleItems.map((item, idx) => {
        if (item.kind !== 'video') return null;
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
    </>
  );
});

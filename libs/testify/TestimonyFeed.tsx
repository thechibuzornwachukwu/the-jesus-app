'use client';

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { BookOpen } from 'lucide-react';
import type { Testimony } from '../../lib/testify/types';
import { TestimonyCard } from './TestimonyCard';
import { EmptyState } from '../shared-ui';

interface TestimonyFeedProps {
  initialTestimonies: Testimony[];
  feedHeight: string;
}

export interface TestimonyFeedHandle {
  scrollToTop: () => void;
}

export const TestimonyFeed = forwardRef<TestimonyFeedHandle, TestimonyFeedProps>(
  function TestimonyFeed({ initialTestimonies, feedHeight }, ref) {
    const [items, setItems] = useState<Testimony[]>(initialTestimonies);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    const scrollToTop = useCallback(() => {
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveIndex(0);
    }, []);

    useImperativeHandle(ref, () => ({ scrollToTop }), [scrollToTop]);

    // Track active card via IntersectionObserver (≥60% visible)
    useEffect(() => {
      const cards = cardRefs.current;
      if (!cards.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.intersectionRatio >= 0.6) {
              const idx = cards.indexOf(entry.target as HTMLDivElement);
              if (idx !== -1) setActiveIndex(idx);
            }
          });
        },
        { threshold: 0.6 }
      );

      cards.forEach((c) => { if (c) observer.observe(c); });
      return () => observer.disconnect();
    }, [items]);

    if (items.length === 0) {
      return (
        <div
          style={{
            height: feedHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <EmptyState
            message="No testimonies yet. Be the first to share what God has done!"
            icon={<BookOpen size={40} />}
          />
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
        {items.map((testimony, idx) => (
          <div
            key={testimony.id}
            ref={(el) => { cardRefs.current[idx] = el; }}
            style={{
              height: feedHeight,
              scrollSnapAlign: 'start',
              flexShrink: 0,
              // Entrance animation when entering viewport
              animation: activeIndex === idx ? 'none' : undefined,
            }}
          >
            <TestimonyCard
              testimony={testimony}
              isActive={activeIndex === idx}
              height={feedHeight}
            />
          </div>
        ))}
      </div>
    );
  }
);

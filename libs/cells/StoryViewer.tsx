'use client';

import React, { useEffect, useRef, useState, useCallback, useTransition } from 'react';
import { X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Avatar } from '../shared-ui/Avatar';
import { markStoryViewed } from '../../lib/cells/actions';
import type { CellStoryGroup, Story } from '../../lib/cells/types';

const STORY_DURATION_MS = 5000;

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface StoryViewerProps {
  group: CellStoryGroup;
  initialIndex?: number;
  onClose: () => void;
  onCreateStory?: () => void;
}

export function StoryViewer({ group, initialIndex = 0, onClose, onCreateStory }: StoryViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [, startTransition] = useTransition();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const story: Story | undefined = group.stories[index];

  const goNext = useCallback(() => {
    if (index < group.stories.length - 1) {
      setIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [index, group.stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setProgress(0);
    }
  }, [index]);

  // Mark current story as viewed
  useEffect(() => {
    if (!story) return;
    startTransition(() => {
      markStoryViewed(story.id);
    });
  }, [story?.id]);

  // Progress timer for images
  useEffect(() => {
    if (!story || story.media_type === 'video' || paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const step = 100 / (STORY_DURATION_MS / 50);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p + step >= 100) {
          clearInterval(intervalRef.current!);
          goNext();
          return 100;
        }
        return p + step;
      });
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [story?.id, paused, goNext]);

  // Video ended → next story
  const handleVideoEnded = useCallback(() => {
    goNext();
  }, [goNext]);

  if (!story) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
      }}
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
      onPointerLeave={() => setPaused(false)}
    >
      {/* Progress bars */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          zIndex: 10,
          display: 'flex',
          gap: 4,
        }}
      >
        {group.stories.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.35)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 2,
                background: '#fff',
                width:
                  i < index
                    ? '100%'
                    : i === index
                    ? `${progress}%`
                    : '0%',
                transition: i === index && !paused ? 'none' : undefined,
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 12,
          right: 12,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
          <Avatar src={story.profiles?.avatar_url ?? null} name={story.profiles?.username ?? ''} size={36} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
            {story.profiles?.username ?? 'Admin'}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
            {relativeTime(story.created_at)}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, pointerEvents: 'all' }}
          aria-label="Close"
        >
          <X size={22} color="#fff" />
        </button>
      </div>

      {/* Media */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {story.media_type === 'video' ? (
          <video
            ref={videoRef}
            src={story.media_url}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onEnded={handleVideoEnded}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) setProgress((v.currentTime / v.duration) * 100);
            }}
          />
        ) : (
          <img
            src={story.media_url}
            alt={story.caption ?? ''}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        )}

        {/* Tap zones */}
        <div
          onClick={goPrev}
          style={{ position: 'absolute', top: 0, left: 0, width: '35%', height: '100%', cursor: 'pointer' }}
          aria-label="Previous story"
        />
        <div
          onClick={goNext}
          style={{ position: 'absolute', top: 0, right: 0, width: '35%', height: '100%', cursor: 'pointer' }}
          aria-label="Next story"
        />
      </div>

      {/* Caption */}
      {story.caption && (
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: 0,
            right: 0,
            padding: '16px 20px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 15,
              color: '#fff',
              textShadow: '0 1px 8px rgba(0,0,0,0.6)',
              lineHeight: 1.5,
            }}
          >
            {story.caption}
          </p>
        </div>
      )}

      {/* Navigation arrows */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 10,
        }}
      >
        <button
          onClick={goPrev}
          disabled={index === 0}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: index === 0 ? 'not-allowed' : 'pointer',
            opacity: index === 0 ? 0.3 : 1,
          }}
        >
          <ChevronLeft size={20} color="#fff" />
        </button>

        {onCreateStory && (
          <button
            onClick={onCreateStory}
            style={{
              background: 'var(--color-accent)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              color: 'var(--color-accent-text)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Plus size={14} />
            Add story
          </button>
        )}

        <button
          onClick={goNext}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronRight size={20} color="#fff" />
        </button>
      </div>
    </div>
  );
}

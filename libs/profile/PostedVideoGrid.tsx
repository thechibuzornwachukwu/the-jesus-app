'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { PostedVideo } from './types';
import { EmptyState } from '../shared-ui';

interface PostedVideoGridProps {
  videos: PostedVideo[];
}

export function PostedVideoGrid({ videos }: PostedVideoGridProps) {
  if (videos.length === 0) {
    return <EmptyState message="No videos posted yet." icon="📹" />;
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 2,
        padding: 'var(--space-2) 0',
      }}
    >
      {videos.map((v) => (
        <Link key={v.id} href="/explore" style={{ display: 'block', textDecoration: 'none' }}>
          <div
            style={{
              aspectRatio: '9 / 16',
              background: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {v.thumbnail_url ? (
              <Image
                src={v.thumbnail_url}
                alt={v.caption ?? 'Video'}
                fill
                sizes="33vw"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, var(--color-faint-bg), var(--color-accent))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-inverse)',
                  fontSize: '1.5rem',
                }}
              >
                ▶
              </div>
            )}
            {/* Like count overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                left: 4,
                fontSize: 'var(--font-size-xs)',
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              ♥ {v.like_count}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

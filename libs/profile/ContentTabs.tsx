'use client';

import React, { useState } from 'react';
import { Heart, BookOpen } from 'lucide-react';
import { SavedVersesList } from './SavedVersesList';
import { JoinedCellsList } from './JoinedCellsList';
import { PostedVideoGrid } from './PostedVideoGrid';
import type { SavedVerse, JoinedCell, PostedVideo, Post } from './types';
import { TabBar, EmptyState } from '../shared-ui';

const TABS = ['Saved Verses', 'My Cells', 'Videos'] as const;
type Tab = (typeof TABS)[number];

interface ContentTabsProps {
  savedVerses: SavedVerse[];
  joinedCells: JoinedCell[];
  postedVideos: PostedVideo[];
  posts: Post[];
}

function PostGrid({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {posts.map((p) => (
        <div
          key={p.id}
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            border: '1px solid var(--color-border)',
          }}
        >
          {p.verse_reference && (
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-accent)',
                fontWeight: 'var(--font-weight-semibold)',
                margin: '0 0 var(--space-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {p.verse_reference}
            </p>
          )}
          {p.verse_text && (
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
                fontStyle: 'italic',
                lineHeight: 'var(--line-height-relaxed)',
                margin: '0 0 var(--space-3)',
                paddingLeft: 'var(--space-3)',
                borderLeft: '2px solid var(--color-accent)',
              }}
            >
              {p.verse_text}
            </p>
          )}
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)',
              lineHeight: 'var(--line-height-relaxed)',
              margin: 0,
            }}
          >
            {p.content}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              marginTop: 'var(--space-3)',
              color: 'var(--color-text-faint)',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            <Heart size={11} />
            <span>{p.like_count}</span>
            <span style={{ marginLeft: 'var(--space-2)' }}>
              {new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function JournalTab({ videos, posts }: { videos: PostedVideo[]; posts: Post[] }) {
  const hasVideos = videos.length > 0;
  const hasPosts = posts.length > 0;

  if (!hasVideos && !hasPosts) {
    return (
      <EmptyState
        message="Nothing shared yet — post a video or write a reflection in Explore."
        icon={<BookOpen size={40} />}
      />
    );
  }

  return (
    <div style={{ paddingBottom: 'var(--space-6)' }}>
      {hasVideos && (
        <>
          {hasPosts && (
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 'var(--font-weight-semibold)',
                margin: 'var(--space-4) 0 var(--space-2)',
              }}
            >
              Videos
            </p>
          )}
          <PostedVideoGrid videos={videos} />
        </>
      )}
      {hasPosts && (
        <>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 'var(--font-weight-semibold)',
              margin: 'var(--space-4) 0 var(--space-2)',
            }}
          >
            Reflections
          </p>
          <PostGrid posts={posts} />
        </>
      )}
    </div>
  );
}

export function ContentTabs({ savedVerses, joinedCells, postedVideos, posts }: ContentTabsProps) {
  const [active, setActive] = useState<Tab>('Saved Verses');

  return (
    <div>
      <TabBar
        tabs={[
          { id: 'Saved Verses', label: 'Saved' },
          { id: 'My Cells',     label: 'Fellowship' },
          { id: 'Videos',       label: 'Journal' },
        ]}
        activeId={active}
        onChange={(id) => setActive(id as Tab)}
        variant="underline"
      />

      <div style={{ padding: '0 var(--space-4)' }}>
        {active === 'Saved Verses' && <SavedVersesList verses={savedVerses} />}
        {active === 'My Cells' && <JoinedCellsList cells={joinedCells} />}
        {active === 'Videos' && <JournalTab videos={postedVideos} posts={posts} />}
      </div>
    </div>
  );
}

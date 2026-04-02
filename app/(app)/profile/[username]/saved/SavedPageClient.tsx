'use client';

import React, { useState } from 'react';
import { Bookmark, Heart, BookOpen, Video } from 'lucide-react';

interface SavedVerse {
  verse_reference: string;
  verse_text: string;
  note?: string | null;
  saved_at: string;
}

interface LikedVideo {
  id: string;
  url: string;
  caption: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

interface Props {
  username: string;
  savedVerses: SavedVerse[];
  likedVideos: LikedVideo[];
}

type Tab = 'verses' | 'videos';

export function SavedPageClient({ savedVerses, likedVideos }: Props) {
  const [tab, setTab] = useState<Tab>('verses');

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 0',
    background: 'none',
    border: 'none',
    borderBottom: active
      ? '2px solid var(--color-accent)'
      : '2px solid transparent',
    color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 'var(--font-size-sm)',
    letterSpacing: '0.04em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'color 0.15s, border-color 0.15s',
  });

  return (
    <div
      style={{
        minHeight: '100%',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 'calc(var(--safe-top) + var(--space-4)) var(--space-4) var(--space-3)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--font-size-xl)',
            fontWeight: 900,
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text)',
          }}
        >
          Saved
        </h1>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <button style={tabStyle(tab === 'verses')} onClick={() => setTab('verses')}>
          <BookOpen size={14} />
          Verses ({savedVerses.length})
        </button>
        <button style={tabStyle(tab === 'videos')} onClick={() => setTab('videos')}>
          <Heart size={14} />
          Liked ({likedVideos.length})
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
        {tab === 'verses' && (
          <>
            {savedVerses.length === 0 ? (
              <EmptyState icon={<Bookmark size={32} />} message="No saved verses yet. Tap the bookmark on any verse to save it." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {savedVerses.map((v) => (
                  <div
                    key={v.verse_reference}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-3) var(--space-4)',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 4px',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 700,
                        color: 'var(--color-accent)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {v.verse_reference}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: 'var(--font-serif)',
                        fontStyle: 'italic',
                        color: 'var(--color-text)',
                        fontSize: 'var(--font-size-sm)',
                        lineHeight: 1.6,
                      }}
                    >
                      {v.verse_text}
                    </p>
                    {v.note && (
                      <p
                        style={{
                          margin: '8px 0 0',
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-muted)',
                          fontStyle: 'italic',
                        }}
                      >
                        {v.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'videos' && (
          <>
            {likedVideos.length === 0 ? (
              <EmptyState icon={<Video size={32} />} message="No liked videos yet. Heart a video in the feed to save it here." />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 4,
                }}
              >
                {likedVideos.map((v) => (
                  <a
                    key={v.id}
                    href={`/explore`}
                    style={{
                      display: 'block',
                      aspectRatio: '9/16',
                      background: 'var(--color-surface)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      position: 'relative',
                      textDecoration: 'none',
                    }}
                  >
                    {v.thumbnail_url ? (
                      <img
                        src={v.thumbnail_url}
                        alt={v.caption ?? 'Video'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--color-surface-high)',
                        }}
                      >
                        <Video size={20} color="var(--color-text-faint)" />
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        gap: 12,
        color: 'var(--color-text-faint)',
      }}
    >
      {icon}
      <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', textAlign: 'center' }}>
        {message}
      </p>
    </div>
  );
}

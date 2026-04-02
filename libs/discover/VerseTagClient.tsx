'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Heart,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { Avatar } from '../shared-ui/Avatar';
import { Skeleton } from '../shared-ui/Skeleton';
import { vibrate } from '../shared-ui/haptics';
import { showToast } from '../shared-ui/Toast';
import { saveVerse } from '../../lib/explore/actions';
import { getPostsByVerseTag } from '../../lib/discover/actions';
import type { DiscoverPost } from '../../lib/discover/actions';

interface VerseTagClientProps {
  verseRef: string;
  verseText: string | null;
  initialPosts: DiscoverPost[];
  initialCursor: string | null;
  postCount: number;
  saveCount: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function PostRow({ post }: { post: DiscoverPost }) {
  return (
    <article
      style={{
        padding: 'var(--space-4)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-2)' }}>
        <Avatar
          src={post.author?.avatar_url ?? null}
          name={post.author?.username ?? '?'}
          size={36}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: 13,
              color: 'var(--color-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            @{post.author?.username ?? 'unknown'}
          </p>
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-faint)', flexShrink: 0 }}>
          {timeAgo(post.created_at)}
        </span>
      </div>

      {/* Content */}
      {post.content && (
        <p
          style={{
            margin: '0 0 var(--space-2)',
            fontSize: 14,
            color: 'var(--color-text)',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } as React.CSSProperties}
        >
          {post.content}
        </p>
      )}

      {/* Image */}
      {post.image_url && (
        <div
          style={{
            marginBottom: 'var(--space-2)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt="Post image"
            style={{ width: '100%', display: 'block', maxHeight: 240, objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 'var(--space-2)' }}>
        <span
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-muted)' }}
        >
          <Heart size={13} aria-hidden /> {post.like_count}
        </span>
        <span
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-muted)' }}
        >
          <MessageCircle size={13} aria-hidden /> {post.comment_count}
        </span>
      </div>
    </article>
  );
}

export function VerseTagClient({
  verseRef,
  verseText,
  initialPosts,
  initialCursor,
  postCount,
  saveCount,
}: VerseTagClientProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [, startTransition] = useTransition();

  function handleBack() {
    vibrate([6]);
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void })
        .startViewTransition(() => router.back());
    } else {
      router.back();
    }
  }

  function handleSave() {
    if (saved || !verseText) return;
    vibrate([8]);
    setSaved(true);
    startTransition(async () => {
      const result = await saveVerse(verseRef, verseText);
      if (result?.error) {
        setSaved(false);
        showToast('Could not save verse', 'error');
      } else {
        showToast('Verse saved!', 'success');
      }
    });
  }

  async function loadMore() {
    if (loadingMore || !cursor) return;
    setLoadingMore(true);
    const { posts: more, nextCursor } = await getPostsByVerseTag(verseRef, cursor);
    setPosts((prev) => [...prev, ...more]);
    setCursor(nextCursor);
    setLoadingMore(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Sticky header ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-4)',
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          gap: 'var(--space-3)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleBack}
          aria-label="Back"
          style={{
            background: 'none',
            border: 'none',
            padding: 4,
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={20} aria-hidden />
        </button>

        <h1
          style={{
            flex: 1,
            margin: 0,
            fontFamily: "'Archivo Condensed', var(--font-display)",
            fontSize: 'var(--font-size-xl)',
            fontWeight: 900,
            letterSpacing: '-0.01em',
            color: 'var(--color-text)',
            lineHeight: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {verseRef}
        </h1>

        {verseText && (
          <button
            onClick={handleSave}
            aria-label={saved ? 'Verse saved' : 'Save this verse'}
            style={{
              background: saved ? 'var(--color-accent-soft)' : 'var(--color-surface)',
              border: `1px solid ${saved ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-full)',
              padding: '6px 12px',
              cursor: saved ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 700,
              color: saved ? 'var(--color-accent)' : 'var(--color-text-muted)',
              flexShrink: 0,
              transition: 'background 0.15s, border-color 0.15s, color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {saved ? <BookmarkCheck size={13} aria-hidden /> : <Bookmark size={13} aria-hidden />}
            {saved ? 'Saved' : 'Save'}
          </button>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Verse text */}
        {verseText && (
          <div
            style={{
              padding: 'var(--space-5) var(--space-4)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "'Lora', var(--font-serif)",
                fontSize: 'var(--font-size-base)',
                lineHeight: 1.7,
                color: 'var(--color-text)',
                fontStyle: 'italic',
              }}
            >
              &ldquo;{verseText}&rdquo;
            </p>
          </div>
        )}

        {/* Stats bar */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-4)',
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            <strong style={{ color: 'var(--color-text)', fontWeight: 700 }}>{postCount}</strong>
            {' '}post{postCount !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            <strong style={{ color: 'var(--color-text)', fontWeight: 700 }}>{saveCount}</strong>
            {' '}save{saveCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Post feed */}
        {posts.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-12) var(--space-6)',
              gap: 'var(--space-3)',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
            }}
          >
            <MessageCircle size={40} strokeWidth={1.2} aria-hidden />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>
              No perspectives yet
            </p>
            <p style={{ margin: 0, fontSize: 13 }}>
              Be the first to share a thought on {verseRef}
            </p>
          </div>
        ) : (
          <>
            {posts.map((p) => (
              <PostRow key={p.id} post={p} />
            ))}

            {loadingMore && (
              <div style={{ padding: 'var(--space-4)' }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    style={{ height: 100, borderRadius: 'var(--radius-md)', marginBottom: 8 }}
                  />
                ))}
              </div>
            )}

            {cursor && !loadingMore && (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                <button
                  onClick={loadMore}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-text-muted)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <RefreshCw size={13} aria-hidden />
                  Load more
                </button>
              </div>
            )}

            {!cursor && posts.length > 0 && (
              <p
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-4)',
                  fontSize: 12,
                  color: 'var(--color-text-faint)',
                  margin: 0,
                }}
              >
                All perspectives loaded
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

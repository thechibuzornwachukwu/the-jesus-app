'use client';

import React, { useState, useCallback } from 'react';
import { Repeat2, Heart, Play } from 'lucide-react';
import type { Repost, Video, Post, ImagePost } from '../../lib/explore/types';
import { Avatar } from '../shared-ui/Avatar';
import { togglePostLike, toggleLike } from '../../lib/explore/actions';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

interface RepostCardProps {
  repost: Repost;
}

export function RepostCard({ repost }: RepostCardProps) {
  const original = repost.original;
  const isVideo = repost.original_type === 'video';

  const originalAsPost = !isVideo ? (original as Post | ImagePost | null) : null;
  const originalAsVideo = isVideo ? (original as Video | null) : null;

  const [liked, setLiked] = useState((originalAsPost as Post | null)?.user_liked ?? false);
  const [likeCount, setLikeCount] = useState((originalAsPost as Post | null)?.like_count ?? 0);

  const handleLike = useCallback(async () => {
    if (!original) return;
    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    setLiked(newLiked);
    setLikeCount(newCount);

    if (isVideo) {
      await toggleLike(repost.original_post_id);
    } else {
      await togglePostLike(repost.original_post_id);
    }
  }, [liked, likeCount, isVideo, original, repost.original_post_id]);

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      {/* Repost header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
        <Repeat2 size={14} />
        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)' }}>
          @{repost.profiles?.username ?? 'believer'} reposted · {relativeTime(repost.created_at)}
        </span>
      </div>

      {/* Embedded original */}
      {original ? (
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          {isVideo && originalAsVideo ? (
            <div style={{ position: 'relative', height: 200, background: 'var(--color-bg)' }}>
              {originalAsVideo.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={originalAsVideo.thumbnail_url}
                  alt={originalAsVideo.caption ?? 'Video'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={40} color="var(--color-text-muted)" />
                </div>
              )}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6) 100%)',
                  pointerEvents: 'none',
                }}
              />
              {originalAsVideo.caption && (
                <p
                  style={{
                    position: 'absolute',
                    bottom: 'var(--space-2)',
                    left: 'var(--space-3)',
                    right: 'var(--space-3)',
                    margin: 0,
                    fontSize: 'var(--font-size-xs)',
                    color: '#fff',
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {originalAsVideo.caption}
                </p>
              )}
              <div
                style={{
                  position: 'absolute',
                  top: 'var(--space-2)',
                  left: 'var(--space-2)',
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: 'var(--radius-full)',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Play size={16} fill="#fff" color="#fff" />
              </div>
            </div>
          ) : originalAsPost ? (
            <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {(originalAsPost as ImagePost).image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(originalAsPost as ImagePost).image_url}
                  alt={(originalAsPost as Post).content ?? 'Image'}
                  style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Avatar src={null} name="?" size={24} />
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  {relativeTime(originalAsPost.created_at)}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text)',
                  lineHeight: 'var(--line-height-relaxed)',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {(originalAsPost as Post).content}
              </p>
              {originalAsPost.verse_reference && (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent)', fontStyle: 'italic' }}>
                  {originalAsPost.verse_reference}
                </span>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div
          style={{
            padding: 'var(--space-3)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-text-faint)',
            fontSize: 'var(--font-size-sm)',
            textAlign: 'center',
          }}
        >
          Original post unavailable
        </div>
      )}

      {/* Quote content */}
      {repost.quote_content && (
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text)',
            lineHeight: 'var(--line-height-relaxed)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {repost.quote_content}
        </p>
      )}

      {/* Quote verse */}
      {repost.quote_verse_ref && repost.quote_verse_text && (
        <blockquote
          style={{
            margin: 0,
            padding: 'var(--space-3) var(--space-4)',
            borderLeft: '3px solid var(--color-accent)',
            background: 'var(--color-accent-soft)',
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-serif, serif)',
              fontStyle: 'italic',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)',
              lineHeight: 'var(--line-height-relaxed)',
            }}
          >
            {repost.quote_verse_text}
          </span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent)', fontWeight: 'var(--font-weight-semibold)' }}>
            {repost.quote_verse_ref}
          </span>
        </blockquote>
      )}

      {/* Like action on original */}
      {original && !isVideo && (
        <button
          onClick={handleLike}
          style={{
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 'var(--space-1) var(--space-2)',
            borderRadius: 'var(--radius-md)',
            color: liked ? 'var(--color-accent)' : 'var(--color-text-muted)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <Heart
            size={16}
            fill={liked ? 'var(--color-accent)' : 'none'}
            color={liked ? 'var(--color-accent)' : 'var(--color-text-muted)'}
          />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
      )}
    </div>
  );
}

'use client';

import React, { useState, useCallback } from 'react';
import { MessageSquare, Share2, Heart } from 'lucide-react';
import type { ImagePost } from '../../lib/explore/types';
import { togglePostLike } from '../../lib/explore/actions';
import { vibrate } from '../shared-ui/haptics';

interface ImageCardProps {
  post: ImagePost;
  height: string;
  onComment: () => void;
  onLikeChanged: (id: string, liked: boolean, likeCount: number) => void;
}

export function ImageCard({ post, height, onComment, onLikeChanged }: ImageCardProps) {
  const [liked, setLiked] = useState(post.user_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [liking, setLiking] = useState(false);

  const handleLike = useCallback(async () => {
    if (liking) return;
    vibrate([8]);
    // Optimistic
    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    setLiked(newLiked);
    setLikeCount(newCount);
    onLikeChanged(post.id, newLiked, newCount);

    setLiking(true);
    const { liked: serverLiked, likeCount: serverCount } = await togglePostLike(post.id);
    setLiking(false);
    setLiked(serverLiked);
    setLikeCount(serverCount);
    onLikeChanged(post.id, serverLiked, serverCount);
  }, [liked, likeCount, liking, post.id, onLikeChanged]);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: post.content ?? 'A Perspective from The JESUS App',
        url: window.location.href,
      }).catch(() => {});
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        background: 'var(--color-bg)',
        overflow: 'hidden',
      }}
    >
      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.image_url}
        alt={post.content ?? 'Image perspective'}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        loading="lazy"
      />

      {/* Gradient overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.75) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top: author info */}
      <div
        style={{
          position: 'absolute',
          top: 'var(--space-4)',
          left: 'var(--space-3)',
          right: 'var(--space-3)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          zIndex: 3,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-full)',
            border: '2px solid var(--color-accent)',
            background: 'var(--color-surface)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-accent)',
            fontWeight: 'var(--font-weight-bold)',
            flexShrink: 0,
          }}
        >
          {post.profiles?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            (post.profiles?.username?.[0] ?? '?').toUpperCase()
          )}
        </div>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-bright)',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            margin: 0,
          }}
        >
          @{post.profiles?.username ?? 'believer'}
        </p>
      </div>

      {/* Bottom: caption + verse */}
      <div
        style={{
          position: 'absolute',
          bottom: 'var(--space-4)',
          left: 'var(--space-3)',
          right: 'calc(56px + var(--space-4) + var(--space-4))',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
        }}
      >
        {post.content && (
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-bright)',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              lineHeight: 'var(--line-height-normal)',
              margin: 0,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {post.content}
          </p>
        )}
        {post.verse_reference && (
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-accent)',
              fontStyle: 'italic',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              margin: 0,
            }}
          >
            {post.verse_reference}
          </p>
        )}
      </div>

      {/* Right action buttons */}
      <div
        style={{
          position: 'absolute',
          right: 'var(--space-3)',
          bottom: 'var(--space-12)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-5)',
          zIndex: 3,
        }}
      >
        <ActionButton
          icon={
            <Heart
              size={26}
              color={liked ? 'var(--color-accent)' : 'var(--color-text)'}
              fill={liked ? 'var(--color-accent)' : 'none'}
            />
          }
          label={liked ? 'Unlike' : 'Like'}
          count={likeCount}
          onClick={handleLike}
        />
        <ActionButton
          icon={<MessageSquare size={26} color="var(--color-text)" />}
          label="Comment"
          count={post.comment_count}
          onClick={onComment}
        />
        <ActionButton
          icon={<Share2 size={26} color="var(--color-text)" />}
          label="Share"
          count={null}
          onClick={handleShare}
        />
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  count,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number | null;
  onClick: () => void;
}) {
  const [pressed, setPressed] = React.useState(false);

  return (
    <button
      onClick={onClick}
      aria-label={label}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: 0,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: pressed ? 'scale(0.85)' : 'scale(1)',
          filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.6))',
        }}
      >
        {icon}
      </span>
      {count !== null && (
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-bright)',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
        </span>
      )}
    </button>
  );
}

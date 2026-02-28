'use client';

import React, { useState, useCallback } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import type { Post } from '../../lib/explore/types';
import { Avatar } from '../shared-ui/Avatar';
import { togglePostLike } from '../../lib/explore/actions';

interface TextPostCardProps {
  post: Post;
  onLikeChanged?: (postId: string, liked: boolean, likeCount: number) => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function TextPostCard({ post, onLikeChanged }: TextPostCardProps) {
  const [liked, setLiked] = useState(post.user_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [isPressing, setIsPressing] = useState(false);

  const handleLike = useCallback(async () => {
    // Optimistic update
    const newLiked = !liked;
    const newCount = likeCount + (newLiked ? 1 : -1);
    setLiked(newLiked);
    setLikeCount(newCount);
    onLikeChanged?.(post.id, newLiked, newCount);

    const result = await togglePostLike(post.id);
    if ('error' in result) {
      // Revert on error
      setLiked(liked);
      setLikeCount(likeCount);
      onLikeChanged?.(post.id, liked, likeCount);
    } else {
      setLiked(result.liked);
      setLikeCount(result.likeCount);
      onLikeChanged?.(post.id, result.liked, result.likeCount);
    }
  }, [liked, likeCount, post.id, onLikeChanged]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ text: post.content });
    } else {
      navigator.clipboard?.writeText(post.content);
    }
  }, [post.content]);

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
        transform: isPressing ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 0.15s ease',
      }}
      onPointerDown={() => setIsPressing(true)}
      onPointerUp={() => setIsPressing(false)}
      onPointerLeave={() => setIsPressing(false)}
    >
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Avatar
          src={post.profiles?.avatar_url ?? null}
          name={post.profiles?.username ?? '?'}
          size={32}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 'var(--font-weight-semibold)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {post.profiles?.username ?? 'Unknown'}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {relativeTime(post.created_at)}
          </div>
        </div>
      </div>

      {/* Post body */}
      <p
        style={{
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-text)',
          lineHeight: 'var(--line-height-relaxed)',
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {post.content}
      </p>

      {/* Verse quote */}
      {post.verse_reference && post.verse_text && (
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
              fontFamily: 'Newsreader, serif',
              fontStyle: 'italic',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)',
              lineHeight: 'var(--line-height-relaxed)',
            }}
          >
            {post.verse_text}
          </span>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-accent)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            {post.verse_reference}
          </span>
        </blockquote>
      )}

      {/* Action row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <ActionButton
          icon={
            <Heart
              size={18}
              fill={liked ? 'var(--color-accent)' : 'none'}
              color={liked ? 'var(--color-accent)' : 'var(--color-text-muted)'}
            />
          }
          label={likeCount > 0 ? String(likeCount) : 'Amen'}
          active={liked}
          onClick={handleLike}
        />
        <ActionButton
          icon={<MessageCircle size={18} color="var(--color-text-muted)" />}
          label={post.comment_count > 0 ? String(post.comment_count) : ''}
          onClick={() => {/* future comment sheet */}}
        />
        <ActionButton
          icon={<Share2 size={18} color="var(--color-text-muted)" />}
          label=""
          onClick={handleShare}
        />
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function ActionButton({ icon, label, active, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 'var(--space-1) var(--space-2)',
        borderRadius: 'var(--radius-md)',
        color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: active ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
        transition: 'color 0.15s, background 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-soft)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'none';
      }}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

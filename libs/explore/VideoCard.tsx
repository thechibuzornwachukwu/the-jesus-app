'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Heart, MessageSquare, Share2, Volume2, VolumeX } from 'lucide-react';
import type { Video } from '../../lib/explore/types';
import { ScriptureOverlay } from './ScriptureOverlay';
import { toggleLike, saveVerse } from '../../lib/explore/actions';
import { vibrate } from '../shared-ui/haptics';

interface VideoCardProps {
  video: Video;
  isActive: boolean;
  height: string;
  onComment: () => void;
  onLikeChanged: (videoId: string, liked: boolean, likeCount: number) => void;
}

export function VideoCard({ video, isActive, height, onComment, onLikeChanged }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(video.user_liked);
  const [likeCount, setLikeCount] = useState(video.like_count);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [amenBurst, setAmenBurst] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  // Autoplay / pause when active changes
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.play().catch(() => {/* Autoplay blocked — user must tap */});
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [isActive]);

  // Double-tap "Amen" (like)
  const lastTap = useRef(0);

  const handleLike = useCallback(async () => {
    vibrate([10]);
    const optimisticLiked = !liked;
    const optimisticCount = Math.max(0, likeCount + (optimisticLiked ? 1 : -1));
    setLiked(optimisticLiked);
    setLikeCount(optimisticCount);
    onLikeChanged(video.id, optimisticLiked, optimisticCount);

    const { liked: serverLiked, likeCount: serverCount } = await toggleLike(video.id);
    setLiked(serverLiked);
    setLikeCount(serverCount);
    onLikeChanged(video.id, serverLiked, serverCount);
  }, [liked, likeCount, video.id, onLikeChanged]);

  const handleVideoTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap
      if (!liked) {
        setAmenBurst(true);
        setTimeout(() => setAmenBurst(false), 900);
        handleLike();
      }
    }
    lastTap.current = now;
  }, [liked, handleLike]);

  const handleSaveVerse = async () => {
    if (!video.verse || saved || saving) return;
    setSaving(true);
    await saveVerse(video.verse.verse_reference, video.verse.verse_text);
    setSaving(false);
    setSaved(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: video.caption ?? 'A Perspective from The JESUS App',
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
        background: '#000',
        overflow: 'hidden',
      }}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={video.url}
        poster={video.thumbnail_url ?? undefined}
        loop
        playsInline
        muted={muted}
        preload="metadata"
        onTimeUpdate={e => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
        onEnded={() => setProgress(0)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        onClick={handleVideoTap}
        aria-label={video.caption ?? 'Community video'}
      />

      {/* Gradient overlays */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            `linear-gradient(to bottom, var(--color-video-top) 0%, transparent 30%, transparent 55%, var(--color-video-bottom) 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Amen burst */}
      {amenBurst && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          <span style={{ display: 'flex', animation: 'amenBurst 0.9s ease-out forwards' }}>
            <Heart size={80} fill="var(--color-accent)" color="var(--color-accent)" />
          </span>
        </div>
      )}

      {/* Mute/Unmute button */}
      <button
        aria-label={muted ? 'Unmute' : 'Mute'}
        onClick={() => { setMuted(m => !m); vibrate([6]); }}
        style={{
          position: 'absolute',
          top: 'calc(var(--safe-top, 0px) + var(--space-3))',
          right: 'var(--space-3)',
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-full)',
          background: 'rgba(0,0,0,0.4)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {muted
          ? <VolumeX size={20} color="#fff" />
          : <Volume2 size={20} color="#fff" />}
      </button>

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
            background: 'var(--color-faint-bg)',
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
          {video.profiles?.avatar_url ? (
            <img src={video.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            (video.profiles?.username?.[0] ?? '?').toUpperCase()
          )}
        </div>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-bright)',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}
        >
          @{video.profiles?.username ?? 'believer'}
        </p>
      </div>

      {/* Caption at bottom-left */}
      {video.caption && (
        <p
          style={{
            position: 'absolute',
            bottom: 'var(--space-4)',
            left: 'var(--space-3)',
            right: 'calc(56px + var(--space-4) + var(--space-4))',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-bright)',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            lineHeight: 'var(--line-height-normal)',
            zIndex: 2,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {video.caption}
        </p>
      )}

      {/* Scripture overlay */}
      {video.verse && (
        <ScriptureOverlay
          verse={video.verse}
          onSave={handleSaveVerse}
          saving={saving}
          saved={saved}
        />
      )}

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
          icon={<Heart size={26} fill={liked ? 'var(--color-accent)' : 'none'} color={liked ? 'var(--color-accent)' : 'rgba(245,247,247,0.9)'} />}
          label={liked ? 'Amen!' : 'Amen'}
          count={likeCount}
          active={liked}
          onClick={handleLike}
        />
        <ActionButton
          icon={<MessageSquare size={26} color="rgba(245,247,247,0.9)" />}
          label="Comment"
          count={video.comment_count}
          onClick={onComment}
        />
        <ActionButton
          icon={<Share2 size={26} color="rgba(245,247,247,0.9)" />}
          label="Share"
          onClick={handleShare}
          count={null}
        />
      </div>

      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.2)', zIndex: 4 }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--color-accent)', transition: 'width 0.25s linear' }} />
      </div>

      <style>{`
        @keyframes amenBurst {
          0%   { transform: scale(0.6); opacity: 1; }
          50%  { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number | null;
  active?: boolean;
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
          transform: pressed ? 'scale(0.82)' : active ? 'scale(1.12)' : 'scale(1)',
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

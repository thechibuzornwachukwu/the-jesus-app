'use client';

import React, { useState } from 'react';
import type { DailyVerseType, VerseComment } from '../../lib/explore/types';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { Avatar } from '../shared-ui/Avatar';
import { ExternalLink, Bookmark, Heart, MessageCircle, Share2, Send } from 'lucide-react';
import {
  saveVerse,
  toggleVerseLike,
  addVerseComment,
  getVerseComments,
} from '../../lib/explore/actions';
import { showToast } from '../shared-ui';

interface DailyVerseProps {
  verse: DailyVerseType;
  initialLikeCount: number;
  initialUserLiked: boolean;
  initialCommentCount: number;
}

export function DailyVerse({
  verse,
  initialLikeCount,
  initialUserLiked,
  initialCommentCount,
}: DailyVerseProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Like state
  const [liked, setLiked] = useState(initialUserLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  // Comment state
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<VerseComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [posting, setPosting] = useState(false);

  const handleSave = async () => {
    if (saved || saving) return;
    setSaving(true);
    const { error } = await saveVerse(verse.reference, verse.text);
    setSaving(false);
    if (error) showToast(error, 'error');
    else { setSaved(true); showToast('Verse saved', 'success'); }
  };

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => wasLiked ? c - 1 : c + 1);
    const res = await toggleVerseLike(verse.reference);
    if (res.error) {
      setLiked(wasLiked);
      setLikeCount((c) => wasLiked ? c + 1 : c - 1);
      showToast(res.error, 'error');
    } else {
      setLikeCount(res.likeCount);
    }
  };

  const handleToggleComments = async () => {
    setShowComments((s) => !s);
    if (!commentsLoaded) {
      const data = await getVerseComments(verse.reference);
      setComments(data);
      setCommentsLoaded(true);
    }
  };

  const handleShare = async () => {
    const text = `"${verse.text}"  ${verse.reference}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: `${verse.reference}  The JESUS App`, text }); }
      catch { /* dismissed */ }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard', 'success');
    }
  };

  const handleComment = async () => {
    if (!commentBody.trim() || posting) return;
    setPosting(true);
    const { comment, error } = await addVerseComment(verse.reference, commentBody);
    setPosting(false);
    if (error) { showToast(error, 'error'); return; }
    if (comment) {
      setComments((c) => [...c, comment]);
      setCommentCount((n) => n + 1);
      setCommentBody('');
    }
  };

  return (
    <>
      {/* ── Collapsed devotional card ── */}
      <div
        style={{
          width: '100%',
          background: 'var(--gradient-verse-banner)',
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--space-6) var(--space-5) var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          cursor: 'pointer',
        }}
        role="button"
        tabIndex={0}
        aria-label={`Daily verse: ${verse.reference}. Tap to meditate.`}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(true); }}
      >
        {/* Label */}
        <p style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 'var(--space-3)',
        }}>
          Verse of the Day
        </p>

        {/* Decorative opening quote */}
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'var(--font-size-5xl)',
            lineHeight: '0.55',
            color: 'var(--color-accent)',
            display: 'block',
            marginBottom: 'var(--space-4)',
            userSelect: 'none',
          }}
        >
          &#8220;
        </span>

        {/* Scripture text */}
        <p style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 'var(--font-size-2xl)',
          lineHeight: 'var(--line-height-relaxed)',
          color: 'var(--color-text)',
          textShadow: '0 0 32px var(--color-verse-glow)',
          maxWidth: '30ch',
          marginBottom: 'var(--space-4)',
        }}>
          {verse.text}
        </p>

        {/* Reference — all-caps small-caps */}
        <p style={{
          fontSize: 'var(--font-size-xs)',
          fontVariant: 'small-caps',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--color-accent)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--space-5)',
        }}>
          {verse.reference}
        </p>

        {/* Action pills row */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            justifyContent: 'flex-end',
            width: '100%',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); handleSave(); }}
            disabled={saved || saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-accent)',
              background: saved ? 'var(--color-accent)' : 'transparent',
              color: saved ? 'var(--color-accent-text)' : 'var(--color-accent)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: saved || saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1,
              transition: 'background 0.15s, color 0.15s',
              flexShrink: 0,
            }}
          >
            <Bookmark size={12} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Saved' : saving ? '…' : 'Save'}
          </button>

          <a
            href={`https://bereanbible.com/bsb.php?passage=${encodeURIComponent(verse.reference)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <ExternalLink size={11} />
            Open Berean
          </a>
        </div>
      </div>

      {/* ── Expanded sheet ── */}
      <BottomSheet open={open} onClose={() => setOpen(false)} title={verse.reference}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {/* Verse quote */}
          <div style={{ textAlign: 'center', padding: 'var(--space-2) 0' }}>
            <span
              aria-hidden="true"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--font-size-4xl)',
                lineHeight: '0.5',
                color: 'var(--color-accent)',
                display: 'block',
                marginBottom: 'var(--space-3)',
                userSelect: 'none',
              }}
            >
              &#8220;
            </span>
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--font-size-xl)',
              lineHeight: 'var(--line-height-relaxed)',
              color: 'var(--color-text-primary)',
              fontStyle: 'italic',
              textShadow: '0 0 24px var(--color-verse-glow)',
              marginBottom: 'var(--space-3)',
            }}>
              {verse.text}
            </p>
            <p style={{
              fontSize: 'var(--font-size-xs)',
              fontVariant: 'small-caps',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--color-accent)',
              fontWeight: 'var(--font-weight-semibold)',
            }}>
              {verse.reference}
            </p>
          </div>

          {/* Reflection */}
          <div style={{ background: 'var(--color-accent-tint)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
            <p style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 'var(--space-2)',
            }}>
              Reflection
            </p>
            <p style={{ fontSize: 'var(--font-size-base)', lineHeight: 'var(--line-height-relaxed)', color: 'var(--color-text-primary)' }}>
              {verse.reflection}
            </p>
          </div>

          {/* ── Action row: Heart / Comment / Share ── */}
          <div style={{
            display: 'flex',
            borderTop: '1px solid var(--color-border)',
            paddingTop: 'var(--space-3)',
            gap: 'var(--space-2)',
          }}>
            {/* Like */}
            <button
              onClick={handleLike}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: 'var(--space-2)',
                background: liked ? 'var(--color-accent-soft)' : 'transparent',
                border: '1px solid',
                borderColor: liked ? 'var(--color-accent)' : 'var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: liked ? 'var(--color-accent)' : 'var(--color-text-muted)',
                transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              }}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>
                {likeCount > 0 ? likeCount : 'Amen'}
              </span>
            </button>

            {/* Comment */}
            <button
              onClick={handleToggleComments}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: 'var(--space-2)',
                background: showComments ? 'var(--color-accent-soft)' : 'transparent',
                border: '1px solid',
                borderColor: showComments ? 'var(--color-accent)' : 'var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: showComments ? 'var(--color-accent)' : 'var(--color-text-muted)',
                transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              }}
            >
              <MessageCircle size={18} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>
                {commentCount > 0 ? commentCount : 'Discuss'}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: 'var(--space-2)',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
              }}
            >
              <Share2 size={18} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>Share</span>
            </button>
          </div>

          {/* ── Comment thread ── */}
          {showComments && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {/* List */}
              <div style={{
                maxHeight: 220,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}>
                {commentsLoaded && comments.length === 0 && (
                  <p style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                    textAlign: 'center',
                    padding: 'var(--space-3) 0',
                  }}>
                    No reflections yet. Be the first to share.
                  </p>
                )}
                {!commentsLoaded && (
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    Loading…
                  </p>
                )}
                {comments.map((c) => (
                  <div key={c.id} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
                    <Avatar src={c.profiles?.avatar_url} name={c.profiles?.username ?? ''} size={28} />
                    <div style={{ flex: 1 }}>
                      <p style={{
                        margin: 0,
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-text)',
                      }}>
                        {c.profiles?.username ?? 'Anonymous'}
                      </p>
                      <p style={{
                        margin: '2px 0 0',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-muted)',
                        lineHeight: 'var(--line-height-relaxed)',
                      }}>
                        {c.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input row */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <input
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Share a reflection…"
                  maxLength={500}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                  style={{
                    flex: 1,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-full)',
                    padding: 'var(--space-2) var(--space-3)',
                    color: 'var(--color-text)',
                    fontSize: 'var(--font-size-sm)',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleComment}
                  disabled={!commentBody.trim() || posting}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-accent)',
                    border: 'none',
                    cursor: commentBody.trim() && !posting ? 'pointer' : 'default',
                    opacity: commentBody.trim() && !posting ? 1 : 0.45,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-accent-text)',
                    flexShrink: 0,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Save verse */}
          <button
            onClick={handleSave}
            disabled={saved || saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-accent)',
              background: saved ? 'var(--color-accent)' : 'transparent',
              color: saved ? 'var(--color-accent-text)' : 'var(--color-accent)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: saved || saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Verse saved' : saving ? 'Saving…' : 'Save verse'}
          </button>

        </div>
      </BottomSheet>
    </>
  );
}

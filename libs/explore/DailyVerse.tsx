'use client';

import React, { useState } from 'react';
import type { DailyVerseType, VerseComment } from '../../lib/explore/types';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { Avatar } from '../shared-ui/Avatar';
import { ChevronRight, Bookmark, Heart, MessageCircle, Share2, Send } from 'lucide-react';
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
      setLikeCount(res.count);
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
    const text = `"${verse.text}" — ${verse.reference}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: `${verse.reference} — The JESUS App`, text }); }
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
      {/* ── Collapsed banner ── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          background: 'var(--gradient-verse-banner)',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--space-3) var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          textAlign: 'left',
          cursor: 'pointer',
        }}
        aria-label={`Daily verse: ${verse.reference}. Tap to meditate.`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--color-accent)', opacity: 0.85 }}>
          <path d="M12 3v18M3 9h18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 'var(--space-1)',
          }}>
            Today · {verse.reference}
          </p>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {verse.text}
          </p>
        </div>
        {/* Right: like count + meditate CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
          {likeCount > 0 && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 2,
              fontSize: 11,
              color: liked ? 'var(--color-accent)' : 'var(--color-text-muted)',
            }}>
              <Heart size={10} fill={liked ? 'currentColor' : 'none'} />
              {likeCount}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--color-accent)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
            Meditate <ChevronRight size={14} />
          </span>
        </div>
      </button>

      {/* ── Expanded sheet ── */}
      <BottomSheet open={open} onClose={() => setOpen(false)} title={verse.reference}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {/* Verse quote */}
          <blockquote style={{ borderLeft: '3px solid var(--color-accent)', paddingLeft: 'var(--space-4)', margin: 0 }}>
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--font-size-xl)',
              lineHeight: 'var(--line-height-relaxed)',
              color: 'var(--color-text-primary)',
              fontStyle: 'italic',
            }}>
              "{verse.text}"
            </p>
            <cite style={{
              display: 'block',
              marginTop: 'var(--space-2)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-accent)',
              fontStyle: 'normal',
              fontWeight: 'var(--font-weight-semibold)',
            }}>
              {verse.reference}
            </cite>
          </blockquote>

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

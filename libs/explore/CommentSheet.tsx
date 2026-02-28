'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { getComments, addComment } from '../../lib/explore/actions';
import type { Comment } from '../../lib/explore/types';
import { EmptyState } from '../shared-ui';
import { showToast } from '../shared-ui';

interface CommentSheetProps {
  videoId: string | null;
  onClose: () => void;
}

export function CommentSheet({ videoId, onClose }: CommentSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!videoId) {
      setComments([]);
      return;
    }
    setLoading(true);
    getComments(videoId).then((data) => {
      setComments(data);
      setLoading(false);
    });
  }, [videoId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId || !text.trim()) return;
    const draft = text.trim();
    setText('');
    startTransition(async () => {
      const { comment, error } = await addComment(videoId, draft);
      if (error) {
        showToast(error, 'error');
      } else if (comment) {
        setComments((prev) => [...prev, comment]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    });
  };

  return (
    <BottomSheet open={!!videoId} onClose={onClose} title="Comments">
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '40dvh' }}>
        {/* Comment list */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 'var(--space-4)' }}>
          {loading ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', textAlign: 'center', padding: 'var(--space-6) 0' }}>
              Loading…
            </p>
          ) : comments.length === 0 ? (
            <EmptyState message="No comments yet. Be the first!" padding="var(--space-6) 0" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {comments.map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  {/* Avatar */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-surface)',
                      border: '1.5px solid var(--color-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-accent)',
                      fontWeight: 'var(--font-weight-bold)',
                      overflow: 'hidden',
                    }}
                  >
                    {c.profiles?.avatar_url ? (
                      <img src={c.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (c.profiles?.username?.[0] ?? '?').toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>
                      {c.profiles?.username ?? 'Anonymous'}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', lineHeight: 'var(--line-height-normal)' }}>
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            maxLength={500}
            style={{
              flex: 1,
              background: 'var(--color-surface-high)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: 'var(--space-2) var(--space-4)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-full)',
              background: text.trim() ? 'var(--color-accent)' : 'var(--color-border)',
              border: 'none',
              color: 'var(--color-text-inverse)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: text.trim() ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}
          >
            Post
          </button>
        </form>
      </div>
    </BottomSheet>
  );
}

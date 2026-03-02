'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Post } from '../../lib/explore/types';
import { addThreadReply } from '../../lib/explore/actions';
import { showToast } from '../shared-ui/Toast';
import { Avatar } from '../shared-ui/Avatar';
import { TextPostCard } from './TextPostCard';

interface ThreadViewProps {
  root: Post;
  replies: Post[];
  userId: string;
}

const CONNECTOR_STYLE: React.CSSProperties = {
  width: 2,
  background: 'var(--color-border)',
  marginLeft: 18,
  height: 24,
};

export function ThreadView({ root, replies, userId }: ThreadViewProps) {
  const router = useRouter();
  const [replyText, setReplyText] = useState('');
  const [threadReplies, setThreadReplies] = useState<Post[]>(replies);
  const [isPosting, startPosting] = useTransition();

  const usernameByPostId = useMemo(() => {
    const map = new Map<string, string>();
    map.set(root.id, root.profiles?.username ?? 'unknown');
    threadReplies.forEach((reply) => {
      map.set(reply.id, reply.profiles?.username ?? 'unknown');
    });
    return map;
  }, [root.id, root.profiles?.username, threadReplies]);

  const submitReply = () => {
    const content = replyText.trim();
    if (!content || isPosting) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: Post = {
      id: tempId,
      user_id: userId,
      content,
      image_url: null,
      verse_reference: null,
      verse_text: null,
      like_count: 0,
      comment_count: 0,
      user_liked: false,
      created_at: new Date().toISOString(),
      thread_root_id: root.id,
      reply_to_post_id: root.id,
      reply_count: 0,
      profiles: { username: 'you', avatar_url: null },
    };

    setThreadReplies((prev) => [optimistic, ...prev]);
    setReplyText('');

    startPosting(async () => {
      const result = await addThreadReply(root.id, root.id, content);
      if (result.error || !result.reply) {
        setThreadReplies((prev) => prev.filter((reply) => reply.id !== tempId));
        setReplyText(content);
        showToast(result.error ?? 'Could not post reply.', 'error');
        return;
      }

      setThreadReplies((prev) =>
        prev.map((reply) => (reply.id === tempId ? result.reply! : reply))
      );
    });
  };

  return (
    <>
      <div
        style={{
          minHeight: '100%',
          padding: 'var(--space-4)',
          paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 88px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            width: 'fit-content',
            background: 'none',
            border: 'none',
            color: 'var(--color-text)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft size={18} />
          Thread
        </button>

        <TextPostCard post={root} readOnly />

        {threadReplies.map((reply) => (
          <React.Fragment key={reply.id}>
            <div style={CONNECTOR_STYLE} />
            <TextPostCard
              post={reply}
              readOnly
              replyingToUsername={usernameByPostId.get(reply.reply_to_post_id ?? '') ?? 'unknown'}
            />
          </React.Fragment>
        ))}
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 'calc(var(--nav-height) + var(--safe-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border)',
          padding: 'var(--space-2) var(--space-4)',
          zIndex: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
          <Avatar src={null} name="You" size={28} />
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply to thread..."
            rows={1}
            style={{
              flex: 1,
              minHeight: 40,
              maxHeight: 120,
              resize: 'vertical',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              padding: '10px 12px',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <button
            onClick={submitReply}
            disabled={isPosting || replyText.trim().length === 0}
            style={{
              height: 36,
              borderRadius: 'var(--radius-full)',
              border: 'none',
              padding: '0 14px',
              cursor: isPosting ? 'not-allowed' : 'pointer',
              background: 'var(--color-accent)',
              color: 'var(--color-accent-text)',
              opacity: isPosting || replyText.trim().length === 0 ? 0.6 : 1,
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            Post
          </button>
        </div>
      </div>
    </>
  );
}

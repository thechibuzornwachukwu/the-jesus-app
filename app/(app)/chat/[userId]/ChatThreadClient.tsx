'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { Avatar } from '../../../../libs/shared-ui/Avatar';
import { LinkPreview } from '../../../../libs/chat/LinkPreview';
import { sendMessage } from '../../../../lib/chat/actions';
import type { DirectMessage } from '../../../../lib/chat/types';
import type { LinkPreview as LinkPreviewType } from '../../../../lib/chat/types';

// Detect /testify/[id] or /explore/[id] links and build a preview stub
function detectLinkPreview(text: string): LinkPreviewType | null {
  const testimonyMatch = text.match(/\/testify\/([a-z0-9-]+)/i);
  if (testimonyMatch) {
    return {
      type: 'testimony',
      url: testimonyMatch[0],
      excerpt: 'Shared testimony',
    };
  }
  const videoMatch = text.match(/\/explore\/([a-z0-9-]+)/i);
  if (videoMatch) {
    return {
      type: 'video',
      url: videoMatch[0],
      title: 'Shared video',
    };
  }
  return null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

interface Partner {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface Props {
  partner: Partner | null;
  initialMessages: DirectMessage[];
  currentUserId: string;
}

export function ChatThreadClient({ partner, initialMessages, currentUserId }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<DirectMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const content = input.trim();
    if (!content || !partner) return;

    const preview = detectLinkPreview(content);

    // Optimistic bubble
    const optimistic: DirectMessage = {
      id: `opt-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: partner.id,
      content,
      link_preview: preview,
      created_at: new Date().toISOString(),
      read_at: null,
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setSending(true);

    const result = await sendMessage(partner.id, content);

    if (result.error) {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      console.error('Send failed:', result.error);
    } else {
      // Replace optimistic with real id
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, id: result.id } : m))
      );
    }

    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

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
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-overlay)' as React.CSSProperties['zIndex'],
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'calc(var(--safe-top) + var(--space-2)) var(--space-4) var(--space-2)',
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Back"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text)',
            display: 'flex',
            padding: 'var(--space-1)',
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={22} />
        </button>

        {partner && (
          <>
            <Avatar src={partner.avatar_url} name={partner.username} size={34} />
            <span
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-display)',
              }}
            >
              @{partner.username}
            </span>
          </>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          paddingBottom: 'var(--space-2)',
        }}
      >
        {messages.length === 0 && (
          <p
            style={{
              textAlign: 'center',
              color: 'var(--color-text-faint)',
              fontSize: 'var(--font-size-sm)',
              marginTop: 'var(--space-8)',
            }}
          >
            Start the conversation.
          </p>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: isMine ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: 'var(--space-2)',
              }}
            >
              {!isMine && partner && (
                <Avatar src={partner.avatar_url} name={partner.username} size={26} />
              )}

              <div style={{ maxWidth: '72%' }}>
                <div
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: isMine
                      ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
                      : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                    background: isMine ? 'var(--color-accent)' : 'var(--color-surface)',
                    color: isMine ? 'var(--color-accent-text)' : 'var(--color-text)',
                    fontSize: 'var(--font-size-sm)',
                    lineHeight: 'var(--line-height-relaxed)',
                    wordBreak: 'break-word',
                    opacity: msg.id.startsWith('opt-') ? 0.7 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {msg.content}
                </div>

                {msg.link_preview && (
                  <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    <LinkPreview preview={msg.link_preview} />
                  </div>
                )}

                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: '0.6rem',
                    color: 'var(--color-text-faint)',
                    textAlign: isMine ? 'right' : 'left',
                  }}
                >
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          padding: 'var(--space-3) var(--space-4)',
          paddingBottom: 'calc(var(--safe-bottom) + var(--space-3))',
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 'var(--space-2)',
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          rows={1}
          style={{
            flex: 1,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-2) var(--space-3)',
            color: 'var(--color-text)',
            fontSize: 'var(--font-size-sm)',
            resize: 'none',
            fontFamily: 'var(--font-sans)',
            lineHeight: 'var(--line-height-normal)',
            outline: 'none',
            maxHeight: 120,
            overflowY: 'auto',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          aria-label="Send"
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-full)',
            background: input.trim() ? 'var(--color-accent)' : 'var(--color-surface)',
            border: 'none',
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: input.trim() ? 'var(--color-accent-text)' : 'var(--color-text-faint)',
            transition: 'background 0.15s, color 0.15s',
            flexShrink: 0,
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

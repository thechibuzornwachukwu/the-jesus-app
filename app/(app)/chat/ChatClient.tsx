'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { Avatar } from '../../../libs/shared-ui/Avatar';
import { EmptyState } from '../../../libs/shared-ui/EmptyState';
import type { Conversation } from '../../../lib/chat/types';

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface Props {
  conversations: Conversation[];
}

export function ChatClient({ conversations }: Props) {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100%', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-overlay)' as React.CSSProperties['zIndex'],
          display: 'flex',
          alignItems: 'center',
          padding: 'calc(var(--safe-top) + var(--space-3)) var(--space-4) var(--space-2)',
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 900,
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text)',
          }}
        >
          Messages
        </h1>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>
        {conversations.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={36} />}
            message="No messages yet. Share a testimony or video with someone."
          />
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => router.push(`/chat/${conv.participant.id}`)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--color-border)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.12s',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar src={conv.participant.avatar_url} name={conv.participant.username} size={46} />
                {conv.unread_count > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 14,
                      height: 14,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-accent)',
                      border: '2px solid var(--color-bg)',
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                  <span
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: conv.unread_count > 0 ? 700 : 'var(--font-weight-medium)',
                      color: 'var(--color-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    @{conv.participant.username}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-faint)', flexShrink: 0 }}>
                    {formatTime(conv.last_message_at)}
                  </span>
                </div>
                {conv.last_message_preview && (
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: 'var(--font-size-xs)',
                      color: conv.unread_count > 0 ? 'var(--color-text)' : 'var(--color-text-muted)',
                      fontWeight: conv.unread_count > 0 ? 600 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {conv.last_message_preview}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

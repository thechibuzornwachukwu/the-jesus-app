'use client';

import React, { useState, useRef } from 'react';
import { Hash, Megaphone, Plus, X, Calendar } from 'lucide-react';
import type { ChannelCategory, Channel, NotificationScore } from '../../lib/cells/types';
import { sortChannelsByPriority, getChannelPriorityClass } from '../../lib/cells/notification-scoring';

/** Returns true when the earliest upcoming meeting for this channel starts within 2 hours */
function useMeetingAlert(channelId: string, upcomingMeetings: UpcomingMeetingHint[]): boolean {
  const cutoff = Date.now() + 2 * 60 * 60 * 1000;
  return upcomingMeetings.some(
    (m) => m.channelId === channelId && new Date(m.scheduledAt).getTime() <= cutoff
  );
}

export type UpcomingMeetingHint = { channelId: string; scheduledAt: string };

interface ChannelSidebarProps {
  cellName: string;
  cellSlug: string;
  categories: ChannelCategory[];
  activeChannelId: string;
  onChannelSelect: (channelId: string) => void;
  userRole: 'admin' | 'member';
  unreadCounts: Record<string, number>;
  notificationScores: NotificationScore;
  onAddChannel: (categoryId: string) => void;
  onEditChannel: (channel: Channel) => void;
  onDeleteChannel: (channelId: string, cellId: string) => void;
  onReorderChannels: (updates: { id: string; position: number }[]) => void;
  onClose?: () => void;
  cellId: string;
  /** Hint list so the sidebar can show pulsing dots for imminent meetings */
  upcomingMeetings?: UpcomingMeetingHint[];
}

export function ChannelSidebar({
  cellName,
  cellSlug,
  categories,
  activeChannelId,
  onChannelSelect,
  userRole,
  unreadCounts,
  notificationScores,
  onAddChannel,
  onEditChannel,
  onDeleteChannel,
  onReorderChannels,
  onClose,
  cellId,
  upcomingMeetings = [],
}: ChannelSidebarProps) {
  const isAdmin = userRole === 'admin';
  const [contextMenu, setContextMenu] = useState<{
    channelId: string;
    x: number;
    y: number;
  } | null>(null);
  const [dragState, setDragState] = useState<{
    draggingId: string | null;
    overCategoryId: string | null;
  }>({ draggingId: null, overCategoryId: null });
  const dragItem = useRef<{ channelId: string; categoryId: string | null; position: number } | null>(null);
  const dragOver = useRef<{ channelId: string; position: number } | null>(null);

  function handleDragStart(
    e: React.DragEvent,
    channelId: string,
    categoryId: string | null,
    position: number
  ) {
    dragItem.current = { channelId, categoryId, position };
    setDragState((s) => ({ ...s, draggingId: channelId }));
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, channelId: string, position: number) {
    e.preventDefault();
    dragOver.current = { channelId, position };
  }

  function handleDrop(e: React.DragEvent, categoryId: string) {
    e.preventDefault();
    if (!dragItem.current || !dragOver.current) return;
    const channels = categories.find((c) => c.id === categoryId)?.channels ?? [];
    const reordered = [...channels.filter((c) => c.id !== dragItem.current!.channelId)];
    const dropIdx = reordered.findIndex((c) => c.id === dragOver.current!.channelId);
    const dragged = channels.find((c) => c.id === dragItem.current!.channelId);
    if (dragged) {
      reordered.splice(dropIdx < 0 ? reordered.length : dropIdx, 0, dragged);
      onReorderChannels(reordered.map((c, i) => ({ id: c.id, position: i })));
    }
    setDragState({ draggingId: null, overCategoryId: null });
    dragItem.current = null;
    dragOver.current = null;
  }

  function handleDragEnd() {
    setDragState({ draggingId: null, overCategoryId: null });
    dragItem.current = null;
    dragOver.current = null;
  }

  return (
    <div
      style={{
        width: 196,
        minWidth: 196,
        height: '100%',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      {/* Mobile handle bar */}
      {onClose && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 32, height: 3, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>
      )}

      {/* Slim header — cell name link + optional close */}
      <div
        style={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
          gap: 4,
        }}
      >
        <a
          href={`/engage/${cellSlug}/info`}
          style={{
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: '0.8125rem',
            color: 'var(--color-text)',
            textDecoration: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            letterSpacing: '-0.01em',
          }}
        >
          {cellName}
        </a>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            style={{ background: 'none', border: 'none', color: 'var(--color-text-faint)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', flexShrink: 0, borderRadius: 4 }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Channels list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 8px' }}>
        {sortChannelsByPriority(categories, notificationScores).map((cat, catIdx) => (
          <div
            key={cat.id}
            onDragOver={(e) => { e.preventDefault(); setDragState((s) => ({ ...s, overCategoryId: cat.id })); }}
            onDrop={(e) => handleDrop(e, cat.id)}
          >
            {/* Category label row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: `${catIdx === 0 ? 6 : 14}px 10px 2px`,
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  color: 'var(--color-text-faint)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.name}
              </span>
              {isAdmin && (
                <button
                  onClick={() => onAddChannel(cat.id)}
                  aria-label="Add channel"
                  title="Add channel"
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-faint)', cursor: 'pointer', padding: '1px 2px', display: 'flex', alignItems: 'center', borderRadius: 3, opacity: 0.5 }}
                >
                  <Plus size={10} />
                </button>
              )}
            </div>

            {/* Channel items */}
            {(cat.channels ?? []).map((ch) => {
              const isActive = ch.id === activeChannelId;
              const unread = unreadCounts[ch.id] ?? 0;
              const score = notificationScores[ch.id] ?? 0;
              const priority = getChannelPriorityClass(score);
              const isDragging = dragState.draggingId === ch.id;
              const isMeeting = ch.channel_type === 'meeting';
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const meetingAlert = useMeetingAlert(ch.id, upcomingMeetings);

              return (
                <div
                  key={ch.id}
                  draggable={isAdmin}
                  onDragStart={(e) => handleDragStart(e, ch.id, cat.id, ch.position)}
                  onDragOver={(e) => handleDragOver(e, ch.id, ch.position)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onChannelSelect(ch.id)}
                  onContextMenu={(e) => {
                    if (!isAdmin) return;
                    e.preventDefault();
                    setContextMenu({ channelId: ch.id, x: e.clientX, y: e.clientY });
                  }}
                  className={`ch-item${isActive ? ' ch-active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 8px',
                    marginInline: 4,
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: isActive
                      ? 'var(--color-surface)'
                      : priority === 'high'
                      ? 'var(--color-accent-soft)'
                      : 'transparent',
                    opacity: isDragging ? 0.3 : 1,
                    transition: 'background 0.1s, opacity 0.12s',
                    userSelect: 'none',
                  }}
                >
                  {/* Channel icon */}
                  <span
                    style={{
                      flexShrink: 0,
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text-faint)',
                      fontSize: 12,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.1s',
                    }}
                  >
                    {ch.emoji ? ch.emoji : isMeeting ? <Calendar size={12} /> : ch.channel_type === 'announcement' ? <Megaphone size={12} /> : <Hash size={12} />}
                    {meetingAlert && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -1,
                          right: -2,
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: 'var(--color-accent)',
                          animation: 'sidebar-meeting-pulse 1.4s ease-in-out infinite',
                        }}
                      />
                    )}
                  </span>

                  {/* Channel name */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: '0.8125rem',
                      color: isActive ? 'var(--color-text)' : unread > 0 ? 'var(--color-text)' : 'var(--color-text-muted)',
                      fontWeight: isActive || unread > 0 ? 600 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.25,
                    }}
                  >
                    {ch.name}
                  </span>

                  {/* Unread badge */}
                  {unread > 0 && (
                    <span
                      style={{
                        background: 'var(--color-accent)',
                        color: 'var(--color-accent-text)',
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-full)',
                        padding: '1px 4px',
                        minWidth: 14,
                        textAlign: 'center',
                        flexShrink: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Context menu (right-click only, no visible button) */}
      {contextMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setContextMenu(null)} />
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              zIndex: 100,
              overflow: 'hidden',
              minWidth: 130,
            }}
          >
            <button
              onClick={() => {
                const channel = categories.flatMap((cat) => cat.channels ?? []).find((ch) => ch.id === contextMenu.channelId);
                if (channel) onEditChannel(channel);
                setContextMenu(null);
              }}
              style={{ width: '100%', padding: '9px 12px', background: 'none', border: 'none', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)' }}
            >
              Edit
            </button>
            <button
              onClick={() => { onDeleteChannel(contextMenu.channelId, cellId); setContextMenu(null); }}
              style={{ width: '100%', padding: '9px 12px', background: 'none', border: 'none', borderTop: '1px solid var(--color-border)', color: 'var(--color-error)', fontSize: 'var(--font-size-sm)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)' }}
            >
              Delete
            </button>
          </div>
        </>
      )}

      <style>{`
        .ch-item:not(.ch-active):hover { background: var(--color-surface) !important; }
        @keyframes sidebar-meeting-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.6); }
        }
      `}</style>
    </div>
  );
}

'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronRight, Hash, Megaphone, Plus, MoreVertical, Info, X } from 'lucide-react';
import type { ChannelCategory, Channel, NotificationScore } from '../../lib/cells/types';

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
  onDeleteChannel,
  onReorderChannels,
  onClose,
  cellId,
}: ChannelSidebarProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
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

  function toggleCategory(catId: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

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
        width: 240,
        minWidth: 240,
        height: '100%',
        background: 'var(--color-panel)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      {/* Cell header */}
      <div
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-3)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <a
          href={`/engage/${cellSlug}/info`}
          style={{
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text)',
            textDecoration: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
          }}
        >
          {cellName}
          <Info size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
        </a>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Channels list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2) 0' }}>
        {categories.map((cat) => {
          const collapsed = collapsedCategories.has(cat.id);
          return (
            <div
              key={cat.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragState((s) => ({ ...s, overCategoryId: cat.id }));
              }}
              onDrop={(e) => handleDrop(e, cat.id)}
            >
              {/* Category header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px var(--space-2) 2px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => toggleCategory(cat.id)}
              >
                {collapsed ? (
                  <ChevronRight size={11} style={{ color: 'var(--color-text-faint)', marginRight: 2, flexShrink: 0 }} />
                ) : (
                  <ChevronDown size={11} style={{ color: 'var(--color-text-faint)', marginRight: 2, flexShrink: 0 }} />
                )}
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.name}
                </span>
                {userRole === 'admin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddChannel(cat.id);
                    }}
                    aria-label="Add channel"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-faint)',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 4,
                    }}
                  >
                    <Plus size={13} />
                  </button>
                )}
              </div>

              {/* Channels in category */}
              {!collapsed &&
                (cat.channels ?? []).map((ch) => {
                  const isActive = ch.id === activeChannelId;
                  const unread = unreadCounts[ch.id] ?? 0;
                  const score = notificationScores[ch.id] ?? 0;
                  const isDragging = dragState.draggingId === ch.id;

                  return (
                    <div
                      key={ch.id}
                      draggable={userRole === 'admin'}
                      onDragStart={(e) => handleDragStart(e, ch.id, cat.id, ch.position)}
                      onDragOver={(e) => handleDragOver(e, ch.id, ch.position)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onChannelSelect(ch.id)}
                      onContextMenu={(e) => {
                        if (userRole !== 'admin') return;
                        e.preventDefault();
                        setContextMenu({ channelId: ch.id, x: e.clientX, y: e.clientY });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: '5px var(--space-3)',
                        marginLeft: 'var(--space-2)',
                        marginRight: 'var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        background: isActive ? 'var(--color-panel-hover)' : 'transparent',
                        borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                        opacity: isDragging ? 0.4 : 1,
                        boxShadow: score >= 15 ? '0 0 0 1px var(--color-accent)' : 'none',
                        transition: 'background 0.1s, box-shadow 0.2s',
                        userSelect: 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-panel-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                      }}
                    >
                      <span style={{ flexShrink: 0, opacity: 0.6, fontSize: 14 }}>
                        {ch.emoji ? (
                          ch.emoji
                        ) : ch.channel_type === 'announcement' ? (
                          <Megaphone size={14} />
                        ) : (
                          <Hash size={14} />
                        )}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 'var(--font-size-sm)',
                          color: isActive
                            ? 'var(--color-text)'
                            : unread > 0
                            ? 'var(--color-text)'
                            : 'var(--color-text-muted)',
                          fontWeight: unread > 0 ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ch.name}
                      </span>
                      {unread > 0 && (
                        <span
                          style={{
                            background: 'var(--color-error)',
                            color: '#fff',
                            fontSize: '0.625rem',
                            fontWeight: 'var(--font-weight-bold)',
                            borderRadius: 'var(--radius-full)',
                            padding: '1px 5px',
                            minWidth: 16,
                            textAlign: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                      {userRole === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu({ channelId: ch.id, x: e.clientX, y: e.clientY });
                          }}
                          aria-label="Channel options"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-faint)',
                            cursor: 'pointer',
                            padding: 2,
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: 4,
                            opacity: 0,
                            flexShrink: 0,
                          }}
                          className="channel-menu-btn"
                        >
                          <MoreVertical size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setContextMenu(null)}
          />
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              background: 'var(--color-surface-dp2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
              overflow: 'hidden',
              minWidth: 140,
            }}
          >
            <button
              onClick={() => {
                onDeleteChannel(contextMenu.channelId, cellId);
                setContextMenu(null);
              }}
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                background: 'none',
                border: 'none',
                color: 'var(--color-error)',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Delete Channel
            </button>
          </div>
        </>
      )}

      <style>{`
        .channel-menu-btn { opacity: 0 !important; }
        div:hover > .channel-menu-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { Menu, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Chat } from './Chat';
import { ChannelSidebar } from './ChannelSidebar';
import { OnlineUsersPanel } from './OnlineUsersPanel';
import { CreateChannelSheet } from './CreateChannelSheet';
import {
  createChannel,
  deleteChannel,
  updateReadState,
  reorderChannels,
} from '../../lib/cells/actions';
import type {
  Cell,
  ChannelCategory,
  CellMemberWithProfile,
  Message,
  Profile,
  NotificationScore,
} from '../../lib/cells/types';

interface CellShellProps {
  cell: Cell;
  categories: ChannelCategory[];
  activeChannelId: string;
  initialMessages: Message[];
  currentUser: Profile;
  userRole: 'admin' | 'member';
  members: CellMemberWithProfile[];
  unreadCounts: Record<string, number>;
  blockedUserIds: string[];
}

export function CellShell({
  cell,
  categories,
  activeChannelId: initialChannelId,
  initialMessages,
  currentUser,
  userRole,
  members,
  unreadCounts: initialUnreadCounts,
  blockedUserIds,
}: CellShellProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [activeChannelId, setActiveChannelId] = useState(initialChannelId);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(initialUnreadCounts);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [createSheetCategoryId, setCreateSheetCategoryId] = useState<string>('');
  const [localCategories, setLocalCategories] = useState<ChannelCategory[]>(categories);

  const activeChannel = localCategories
    .flatMap((c) => c.channels ?? [])
    .find((ch) => ch.id === activeChannelId);

  const notificationScores: NotificationScore = Object.fromEntries(
    Object.entries(unreadCounts).map(([id, count]) => [id, count * 5])
  );

  const handleChannelSelect = useCallback(
    (channelId: string) => {
      setActiveChannelId(channelId);
      setLeftOpen(false);
      // Optimistically clear unread for this channel
      setUnreadCounts((prev) => ({ ...prev, [channelId]: 0 }));
      // Update read state on server
      startTransition(() => {
        updateReadState(channelId);
      });
      // Navigate to new channel URL
      router.push(`/engage/${cell.slug}/${channelId}`);
    },
    [cell.slug, router]
  );

  const handleAddChannel = useCallback((categoryId: string) => {
    setCreateSheetCategoryId(categoryId);
    setCreateSheetOpen(true);
  }, []);

  const handleCreateChannel = useCallback(
    async (data: {
      name: string;
      emoji: string;
      color: string;
      channelType: import('../../lib/cells/types').ChannelType;
      categoryId: string;
    }) => {
      const result = await createChannel(cell.id, {
        name: data.name,
        emoji: data.emoji,
        color: data.color,
        channelType: data.channelType,
        categoryId: data.categoryId,
      });
      if ('id' in result) {
        // Optimistically add to local categories
        setLocalCategories((prev) =>
          prev.map((cat) => {
            if (cat.id !== data.categoryId) return cat;
            return {
              ...cat,
              channels: [
                ...(cat.channels ?? []),
                {
                  id: result.id,
                  cell_id: cell.id,
                  category_id: data.categoryId,
                  name: data.name.toLowerCase().replace(/\s+/g, '-'),
                  emoji: data.emoji,
                  color: data.color,
                  channel_type: data.channelType,
                  position: (cat.channels?.length ?? 0),
                  topic: null,
                  is_read_only: false,
                  created_by: currentUser.id,
                  created_at: new Date().toISOString(),
                },
              ],
            };
          })
        );
        setCreateSheetOpen(false);
      }
    },
    [cell.id, currentUser.id]
  );

  const handleDeleteChannel = useCallback(
    async (channelId: string, cellId: string) => {
      await deleteChannel(channelId, cellId);
      setLocalCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          channels: (cat.channels ?? []).filter((ch) => ch.id !== channelId),
        }))
      );
      // If deleted the active channel, switch to first available
      if (channelId === activeChannelId) {
        const first = localCategories.flatMap((c) => c.channels ?? []).find((ch) => ch.id !== channelId);
        if (first) handleChannelSelect(first.id);
      }
    },
    [activeChannelId, handleChannelSelect, localCategories]
  );

  const handleReorderChannels = useCallback(
    async (updates: { id: string; position: number }[]) => {
      await reorderChannels(updates);
    },
    []
  );

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100dvh - var(--nav-height) - var(--safe-bottom) - var(--safe-top))',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Mobile overlay backdrop ── */}
      {leftOpen && (
        <div
          onClick={() => setLeftOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 29,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Left: Channel sidebar ── */}
      {/* Desktop: always visible in grid */}
      <div
        className="cell-sidebar-desktop"
        style={{ display: 'none', flexShrink: 0 }}
      >
        <ChannelSidebar
          cellName={cell.name}
          cellSlug={cell.slug}
          cellId={cell.id}
          categories={localCategories}
          activeChannelId={activeChannelId}
          onChannelSelect={handleChannelSelect}
          userRole={userRole}
          unreadCounts={unreadCounts}
          notificationScores={notificationScores}
          onAddChannel={handleAddChannel}
          onEditChannel={() => {}}
          onDeleteChannel={handleDeleteChannel}
          onReorderChannels={handleReorderChannels}
        />
      </div>

      {/* Mobile: overlay drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 30,
          transform: leftOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          display: 'block',
        }}
        className="cell-sidebar-mobile"
      >
        <ChannelSidebar
          cellName={cell.name}
          cellSlug={cell.slug}
          cellId={cell.id}
          categories={localCategories}
          activeChannelId={activeChannelId}
          onChannelSelect={handleChannelSelect}
          userRole={userRole}
          unreadCounts={unreadCounts}
          notificationScores={notificationScores}
          onAddChannel={handleAddChannel}
          onEditChannel={() => {}}
          onDeleteChannel={handleDeleteChannel}
          onReorderChannels={handleReorderChannels}
          onClose={() => setLeftOpen(false)}
        />
      </div>

      {/* ── Center: Chat area ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile header with sidebar toggle */}
        <div
          className="cell-mobile-header"
          style={{
            display: 'none',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '0 var(--space-3)',
            height: 44,
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-panel)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setLeftOpen(true)}
            aria-label="Open channels"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
            }}
          >
            <Menu size={18} />
          </button>
          <span
            style={{
              flex: 1,
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {activeChannel?.emoji ? `${activeChannel.emoji} ` : '#'}{activeChannel?.name ?? ''}
          </span>
          <button
            onClick={() => setRightCollapsed((v) => !v)}
            aria-label="Toggle members"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
            }}
          >
            <Users size={16} />
          </button>
        </div>

        <Chat
          cellId={cell.id}
          cellName={cell.name}
          cellAvatar={cell.avatar_url}
          currentUser={currentUser}
          initialMessages={initialMessages}
          blockedUserIds={blockedUserIds}
          userRole={userRole}
          channelId={activeChannelId}
          channelTopic={activeChannel?.topic ?? null}
        />
      </div>

      {/* ── Right: Online users panel (desktop) ── */}
      <div className="cell-users-panel-desktop" style={{ display: 'none' }}>
        <OnlineUsersPanel
          members={members}
          onlineMemberIds={new Set<string>()}
          currentUserId={currentUser.id}
          collapsed={rightCollapsed}
          onToggle={() => setRightCollapsed((v) => !v)}
        />
      </div>

      {/* ── Create channel sheet ── */}
      <CreateChannelSheet
        open={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        categories={localCategories}
        defaultCategoryId={createSheetCategoryId}
        onSubmit={handleCreateChannel}
      />

      <style>{`
        @media (min-width: 768px) {
          .cell-sidebar-mobile { display: none !important; }
          .cell-sidebar-desktop { display: flex !important; }
          .cell-users-panel-desktop { display: flex !important; }
          .cell-mobile-header { display: none !important; }
        }
        @media (max-width: 767px) {
          .cell-sidebar-desktop { display: none !important; }
          .cell-mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

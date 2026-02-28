'use client';

import React, { useState, useCallback, useTransition, useEffect } from 'react';
import { Menu, Users, CalendarPlus } from 'lucide-react';
import {
  applyScore,
  NOTIFICATION_CLICK,
  VIEW_WITHOUT_NOTIFICATION,
  VIEW_AFTER_NOTIFICATION,
  MESSAGE_SENT,
} from '../../lib/cells/notification-scoring';
import { useRouter } from 'next/navigation';
import { Chat } from './Chat';
import { ChannelSidebar } from './ChannelSidebar';
import type { UpcomingMeetingHint } from './ChannelSidebar';
import { OnlineUsersPanel } from './OnlineUsersPanel';
import { CreateChannelSheet } from './CreateChannelSheet';
import { MeetingCard } from './MeetingCard';
import { ScheduleMeetingSheet } from './ScheduleMeetingSheet';
import {
  createChannel,
  deleteChannel,
  updateReadState,
  reorderChannels,
} from '../../lib/cells/actions';
import {
  getUpcomingMeetings,
  getMeetingWithRsvps,
} from '../../lib/cells/meeting-actions';
import type { ScheduledMeeting, MeetingWithRsvps } from '../../lib/cells/meeting-actions';
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

  // ── Meeting state ──────────────────────────────────────────────────────────
  const [meetingsData, setMeetingsData] = useState<Record<string, MeetingWithRsvps[]>>({});
  const [upcomingHints, setUpcomingHints] = useState<UpcomingMeetingHint[]>([]);
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ScheduledMeeting | null>(null);

  const activeChannel = localCategories
    .flatMap((c) => c.channels ?? [])
    .find((ch) => ch.id === activeChannelId);

  const notificationScores: NotificationScore = Object.fromEntries(
    Object.entries(unreadCounts).map(([id, count]) => [id, count * 5])
  );

  // On mount: check if we arrived via a push notification for this channel
  useEffect(() => {
    const notifKey = `notif_channel_${initialChannelId}`;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(notifKey)) {
      sessionStorage.removeItem(notifKey);
      applyScore(initialChannelId, NOTIFICATION_CLICK);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load upcoming meetings when the active channel is a meeting channel
  useEffect(() => {
    if (activeChannel?.channel_type !== 'meeting') return;

    // Fetch all upcoming meetings for the whole cell (for sidebar hints)
    getUpcomingMeetings(cell.id).then((meetings) => {
      setUpcomingHints(meetings.map((m) => ({ channelId: m.channel_id, scheduledAt: m.scheduled_at })));

      // Fetch full RSVP detail for meetings in this channel
      const channelMeetings = meetings.filter((m) => m.channel_id === activeChannelId);
      Promise.all(channelMeetings.map((m) => getMeetingWithRsvps(m.id))).then((results) => {
        const valid = results.filter((r): r is MeetingWithRsvps => r !== null);
        setMeetingsData((prev) => ({ ...prev, [activeChannelId]: valid }));
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannelId]);

  const handleChannelSelect = useCallback(
    (channelId: string) => {
      // Score the channel we're leaving
      const prevId = activeChannelId;
      const notifKey = `notif_channel_${prevId}`;
      const wasFromNotif =
        typeof sessionStorage !== 'undefined' && sessionStorage.getItem(notifKey);
      if (wasFromNotif) {
        sessionStorage.removeItem(notifKey);
        applyScore(prevId, VIEW_AFTER_NOTIFICATION);
      } else {
        applyScore(prevId, VIEW_WITHOUT_NOTIFICATION);
      }

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
    [cell.slug, router, activeChannelId]
  );

  const handleMessageSent = useCallback(() => {
    applyScore(activeChannelId, MESSAGE_SENT);
  }, [activeChannelId]);

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
          upcomingMeetings={upcomingHints}
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
          upcomingMeetings={upcomingHints}
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

        {/* Meeting channel: admin header + meeting cards */}
        {activeChannel?.channel_type === 'meeting' && (
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderBottom: '1px solid var(--color-border)',
              flexShrink: 0,
            }}
          >
            {/* Admin "Schedule Meeting" button in channel header */}
            {userRole === 'admin' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-2)' }}>
                <button
                  onClick={() => { setEditingMeeting(null); setScheduleMeetingOpen(true); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    padding: '5px 12px',
                    background: 'var(--color-accent)',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--color-accent-text)',
                    fontSize: '0.8125rem',
                    fontWeight: 'var(--font-weight-semibold)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <CalendarPlus size={13} />
                  Schedule Meeting
                </button>
              </div>
            )}

            {/* Meeting cards */}
            {(meetingsData[activeChannelId] ?? []).map(({ meeting, rsvps }) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                rsvps={rsvps}
                currentUserId={currentUser.id}
                userRole={userRole}
                cellId={cell.id}
                onEdit={(m) => { setEditingMeeting(m); setScheduleMeetingOpen(true); }}
                onCancelled={(id) => {
                  setMeetingsData((prev) => ({
                    ...prev,
                    [activeChannelId]: (prev[activeChannelId] ?? []).filter((mw) => mw.meeting.id !== id),
                  }));
                }}
              />
            ))}
          </div>
        )}

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
          onMessageSent={handleMessageSent}
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

      {/* ── Schedule meeting sheet ── */}
      <ScheduleMeetingSheet
        open={scheduleMeetingOpen}
        onClose={() => { setScheduleMeetingOpen(false); setEditingMeeting(null); }}
        channelId={activeChannelId}
        cellId={cell.id}
        editMeeting={editingMeeting}
        onSaved={(meetingId) => {
          // Reload meetings for this channel
          getMeetingWithRsvps(meetingId).then((mw) => {
            if (!mw) return;
            setMeetingsData((prev) => {
              const existing = prev[activeChannelId] ?? [];
              const idx = existing.findIndex((e) => e.meeting.id === meetingId);
              if (idx >= 0) {
                const updated = [...existing];
                updated[idx] = mw;
                return { ...prev, [activeChannelId]: updated };
              }
              return { ...prev, [activeChannelId]: [...existing, mw] };
            });
            // Update sidebar hints too
            setUpcomingHints((prev) => {
              const filtered = prev.filter((h) => h.channelId !== mw.meeting.channel_id ||
                h.scheduledAt !== mw.meeting.scheduled_at);
              return [...filtered, { channelId: mw.meeting.channel_id, scheduledAt: mw.meeting.scheduled_at }];
            });
          });
        }}
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

'use client';

import React, { useState, useCallback, useTransition, useEffect } from 'react';
import { ChevronLeft, Users, MoreVertical, CalendarPlus, Menu } from 'lucide-react';
import {
  applyScore,
  NOTIFICATION_CLICK,
  VIEW_WITHOUT_NOTIFICATION,
  VIEW_AFTER_NOTIFICATION,
  MESSAGE_SENT,
} from '../../lib/cells/notification-scoring';
import { useRouter } from 'next/navigation';
import { Chat } from './Chat';
import { StoriesStrip } from './StoriesStrip';
import { CreateStorySheet } from './CreateStorySheet';
import { MemberList } from './MemberList';
import { CreateChannelSheet } from './CreateChannelSheet';
import { MeetingCard } from './MeetingCard';
import { ScheduleMeetingSheet } from './ScheduleMeetingSheet';
import { ChannelSidebar, type UpcomingMeetingHint } from './ChannelSidebar';
import {
  createChannel,
  deleteChannel,
  updateChannel,
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
  Channel,
  CellMemberWithProfile,
  Message,
  Profile,
  NotificationScore,
  CellStoryGroup,
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
  storyGroups?: CellStoryGroup[];
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
  storyGroups = [],
}: CellShellProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [activeChannelId, setActiveChannelId] = useState(initialChannelId);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(initialUnreadCounts);
  const [localCategories, setLocalCategories] = useState<ChannelCategory[]>(categories);
  const [memberListOpen, setMemberListOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [createCategoryId, setCreateCategoryId] = useState<string>('');
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [meetingsData, setMeetingsData] = useState<Record<string, MeetingWithRsvps[]>>({});
  const [upcomingMeetingHints, setUpcomingMeetingHints] = useState<UpcomingMeetingHint[]>([]);
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ScheduledMeeting | null>(null);

  const allChannels: Channel[] = localCategories.flatMap((c) => c.channels ?? []);
  const activeChannel = allChannels.find((ch) => ch.id === activeChannelId);
  const onlineCount = members.length;

  const notificationScores: NotificationScore = Object.fromEntries(
    Object.entries(unreadCounts).map(([id, count]) => [id, count * 5])
  );

  useEffect(() => {
    const notifKey = `notif_channel_${initialChannelId}`;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(notifKey)) {
      sessionStorage.removeItem(notifKey);
      applyScore(initialChannelId, NOTIFICATION_CLICK);
    }
  }, [initialChannelId]);

  useEffect(() => {
    if (activeChannel?.channel_type !== 'meeting') return;
    getUpcomingMeetings(cell.id).then((meetings) => {
      const channelMeetings = meetings.filter((m) => m.channel_id === activeChannelId);
      Promise.all(channelMeetings.map((m) => getMeetingWithRsvps(m.id))).then((results) => {
        const valid = results.filter((r): r is MeetingWithRsvps => r !== null);
        setMeetingsData((prev) => ({ ...prev, [activeChannelId]: valid }));
      });
    });
  }, [activeChannel?.channel_type, activeChannelId, cell.id]);

  useEffect(() => {
    getUpcomingMeetings(cell.id).then((meetings) => {
      setUpcomingMeetingHints(
        meetings.map((m) => ({ channelId: m.channel_id, scheduledAt: m.scheduled_at }))
      );
    });
  }, [cell.id]);

  const handleChannelSelect = useCallback(
    (channelId: string) => {
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
      setUnreadCounts((prev) => ({ ...prev, [channelId]: 0 }));
      startTransition(() => { updateReadState(channelId); });
      router.push(`/engage/${cell.slug}/${channelId}`);
    },
    [cell.slug, router, activeChannelId]
  );

  const handleMessageSent = useCallback(() => {
    applyScore(activeChannelId, MESSAGE_SENT);
  }, [activeChannelId]);

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
      if (channelId === activeChannelId) {
        const first = allChannels.find((ch) => ch.id !== channelId);
        if (first) handleChannelSelect(first.id);
      }
    },
    [activeChannelId, allChannels, handleChannelSelect]
  );

  const handleEditChannel = useCallback(
    async (channel: Channel) => {
      if (userRole !== 'admin') return;
      const nextName = window.prompt('Edit channel name', channel.name);
      if (nextName === null) return;
      const trimmed = nextName.trim();
      if (!trimmed) return;
      const result = await updateChannel(channel.id, cell.id, { name: trimmed });
      if ('error' in result) return;
      const normalized = trimmed.toLowerCase().replace(/\s+/g, '-');
      setLocalCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          channels: (cat.channels ?? []).map((ch) =>
            ch.id === channel.id ? { ...ch, name: normalized } : ch
          ),
        }))
      );
    },
    [cell.id, userRole]
  );

  const handleOpenCreateChannel = useCallback((categoryId: string) => {
    setCreateCategoryId(categoryId);
    setCreateSheetOpen(true);
  }, []);

  const handleReorderChannels = useCallback(async (updates: { id: string; position: number }[]) => {
    await reorderChannels(updates);
    setLocalCategories((prev) =>
      prev.map((cat) => {
        const ids = new Set((cat.channels ?? []).map((c) => c.id));
        const scoped = updates.filter((u) => ids.has(u.id));
        if (scoped.length === 0) return cat;
        const nextById = new Map(scoped.map((s) => [s.id, s.position]));
        const sorted = [...(cat.channels ?? [])].sort(
          (a, b) => (nextById.get(a.id) ?? a.position) - (nextById.get(b.id) ?? b.position)
        );
        return { ...cat, channels: sorted.map((c, i) => ({ ...c, position: i })) };
      })
    );
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100dvh - var(--nav-height) - var(--safe-bottom) - var(--safe-top))',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          height: 48,
          padding: '0 var(--space-3)',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open channels"
          className="mobile-only-btn"
          style={{
            display: 'flex',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            alignItems: 'center',
            padding: 4,
            flexShrink: 0,
          }}
        >
          <Menu size={18} />
        </button>
        <button
          onClick={() => router.push('/engage')}
          aria-label="Back"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: 4,
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={20} />
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
          {cell.name}
        </span>
        <button
          onClick={() => setMemberListOpen(true)}
          aria-label={`${onlineCount} members`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            padding: '4px 6px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-success)', flexShrink: 0 }} />
          <Users size={14} />
          <span style={{ fontSize: 12, fontWeight: 500 }}>{onlineCount}</span>
        </button>
        <button
          onClick={() => router.push(`/engage/${cell.slug}/info`)}
          aria-label="Cell info"
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
          <MoreVertical size={18} />
        </button>
      </div>

      {cell.banner_url && (
        <div
          style={{
            height: 100,
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src={cell.banner_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 40%, var(--color-bg) 100%)',
            }}
          />
        </div>
      )}

      {(storyGroups.length > 0 || userRole === 'admin') && (
        <StoriesStrip
          groups={storyGroups}
          userRole={userRole}
          activeCellId={cell.id}
          onCreateStory={userRole === 'admin' ? () => setCreateStoryOpen(true) : undefined}
        />
      )}

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div className="desktop-sidebar-shell" style={{ minHeight: 0 }}>
          <ChannelSidebar
            cellName={cell.name}
            cellSlug={cell.slug}
            categories={localCategories}
            activeChannelId={activeChannelId}
            onChannelSelect={handleChannelSelect}
            userRole={userRole}
            unreadCounts={unreadCounts}
            notificationScores={notificationScores}
            onAddChannel={handleOpenCreateChannel}
            onEditChannel={handleEditChannel}
            onDeleteChannel={handleDeleteChannel}
            onReorderChannels={handleReorderChannels}
            cellId={cell.id}
            upcomingMeetings={upcomingMeetingHints}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {activeChannel?.channel_type === 'meeting' && (
            <div
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderBottom: '1px solid var(--color-border)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-2)' }}>
                <button
                  onClick={() => {
                    if (userRole !== 'admin') return;
                    setEditingMeeting(null);
                    setScheduleMeetingOpen(true);
                  }}
                  disabled={userRole !== 'admin'}
                  title={userRole === 'admin' ? 'Schedule meeting' : 'Only admins can schedule meetings'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    padding: '5px 12px',
                    background: userRole === 'admin' ? 'var(--color-accent)' : 'var(--color-surface)',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    color: userRole === 'admin' ? 'var(--color-accent-text)' : 'var(--color-text-faint)',
                    fontSize: '0.8125rem',
                    fontWeight: 'var(--font-weight-semibold)',
                    cursor: userRole === 'admin' ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <CalendarPlus size={13} />
                  Schedule Meeting
                </button>
              </div>
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
      </div>

      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }}
          />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 41 }}>
            <ChannelSidebar
              cellName={cell.name}
              cellSlug={cell.slug}
              categories={localCategories}
              activeChannelId={activeChannelId}
              onChannelSelect={(id) => {
                setSidebarOpen(false);
                handleChannelSelect(id);
              }}
              userRole={userRole}
              unreadCounts={unreadCounts}
              notificationScores={notificationScores}
              onAddChannel={handleOpenCreateChannel}
              onEditChannel={handleEditChannel}
              onDeleteChannel={handleDeleteChannel}
              onReorderChannels={handleReorderChannels}
              onClose={() => setSidebarOpen(false)}
              cellId={cell.id}
              upcomingMeetings={upcomingMeetingHints}
            />
          </div>
        </>
      )}

      <MemberList
        open={memberListOpen}
        onClose={() => setMemberListOpen(false)}
        cellId={cell.id}
        onlineMemberIds={new Set<string>()}
        currentUserId={currentUser.id}
        userRole={userRole}
      />

      <CreateChannelSheet
        open={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        categories={localCategories}
        defaultCategoryId={createCategoryId || localCategories[0]?.id || ''}
        onSubmit={handleCreateChannel}
      />

      <CreateStorySheet
        open={createStoryOpen}
        onClose={() => setCreateStoryOpen(false)}
        cellId={cell.id}
      />

      <ScheduleMeetingSheet
        open={scheduleMeetingOpen}
        onClose={() => { setScheduleMeetingOpen(false); setEditingMeeting(null); }}
        channelId={activeChannelId}
        cellId={cell.id}
        editMeeting={editingMeeting}
        onSaved={(meetingId) => {
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
          });
        }}
      />

      <style>{`
        .desktop-sidebar-shell { display: none; }
        @media (min-width: 980px) {
          .desktop-sidebar-shell { display: flex; }
          .mobile-only-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}

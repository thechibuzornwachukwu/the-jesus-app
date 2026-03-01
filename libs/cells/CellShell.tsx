'use client';

import React, { useState, useCallback, useTransition, useEffect } from 'react';
import { ChevronLeft, Users, MoreVertical, Hash, Megaphone, Calendar, CalendarPlus } from 'lucide-react';
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
  const [createStoryOpen, setCreateStoryOpen] = useState(false);

  // ── Meeting state ────────────────────────────────────────────────────────
  const [meetingsData, setMeetingsData] = useState<Record<string, MeetingWithRsvps[]>>({});
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ScheduledMeeting | null>(null);

  // Flatten all channels into a single ordered list for horizontal tabs
  const allChannels: Channel[] = localCategories.flatMap((c) => c.channels ?? []);

  const activeChannel = allChannels.find((ch) => ch.id === activeChannelId);
  const onlineCount = members.length; // simplified; presence would give real count

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

  // Load upcoming meetings for meeting channels
  useEffect(() => {
    if (activeChannel?.channel_type !== 'meeting') return;
    getUpcomingMeetings(cell.id).then((meetings) => {
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
    [activeChannelId, handleChannelSelect, allChannels]
  );

  const handleReorderChannels = useCallback(async (updates: { id: string; position: number }[]) => {
    await reorderChannels(updates);
  }, []);

  function channelIcon(ch: Channel) {
    if (ch.channel_type === 'announcement') return <Megaphone size={13} />;
    if (ch.channel_type === 'meeting') return <Calendar size={13} />;
    return <Hash size={13} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100dvh - var(--nav-height) - var(--safe-bottom) - var(--safe-top))',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
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
        {/* Online count button */}
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

      {/* ── Banner (collapsible  just shown as a thin coloured strip if no image) ── */}
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

      {/* ── Stories strip (admin-posted cell announcements) ── */}
      {(storyGroups.length > 0 || userRole === 'admin') && (
        <StoriesStrip
          groups={storyGroups}
          userRole={userRole}
          activeCellId={cell.id}
          onCreateStory={userRole === 'admin' ? () => setCreateStoryOpen(true) : undefined}
        />
      )}

      {/* ── Horizontal channel tabs ── */}
      {allChannels.length > 0 && (
        <div
          style={{
            display: 'flex',
            overflowX: 'auto',
            gap: 6,
            padding: '6px 12px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            scrollbarWidth: 'none',
            flexShrink: 0,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {allChannels.map((ch) => {
            const isActive = ch.id === activeChannelId;
            const unread = unreadCounts[ch.id] ?? 0;
            return (
              <button
                key={ch.id}
                onClick={() => handleChannelSelect(ch.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: isActive ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: isActive ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  position: 'relative',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {ch.emoji ? (
                  <span style={{ fontSize: 13 }}>{ch.emoji}</span>
                ) : (
                  channelIcon(ch)
                )}
                <span>{ch.name}</span>
                {unread > 0 && !isActive && (
                  <span
                    style={{
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      background: 'var(--color-accent)',
                      color: 'var(--color-accent-text)',
                      fontSize: 9,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                    }}
                  >
                    {unread}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin: add channel */}
          {userRole === 'admin' && (
            <button
              onClick={() => setCreateSheetOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px dashed var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-faint)',
                fontSize: 12,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              + channel
            </button>
          )}
        </div>
      )}

      {/* ── Meeting channel header ── */}
      {activeChannel?.channel_type === 'meeting' && (
        <div
          style={{
            padding: 'var(--space-2) var(--space-3)',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
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

      {/* ── Chat ── */}
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

      {/* ── Sheets ── */}
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
        defaultCategoryId={localCategories[0]?.id ?? ''}
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
    </div>
  );
}

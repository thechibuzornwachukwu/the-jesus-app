'use client';

import React, { useState, useCallback, useTransition, useEffect, useRef } from 'react';
import { ChevronLeft, Users, MoreVertical, CalendarPlus, Hash, Calendar, Megaphone, Phone } from 'lucide-react';
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
import ActiveCallBanner from './ActiveCallBanner';
import JitsiCallScreen from './JitsiCallScreen';
import {
  createChannel,
  deleteChannel,
  updateChannel,
  updateReadState,
  reorderChannels,
  startCall,
  endCall,
  getActiveCall,
} from '../../lib/cells/actions';
import { fetchChannelMessages } from '../../lib/cells/channel-actions';
import {
  getUpcomingMeetings,
  getMeetingWithRsvps,
} from '../../lib/cells/meeting-actions';
import { createClient as createSupabaseBrowserClient } from '../../lib/supabase/client';
import type { ScheduledMeeting, MeetingWithRsvps } from '../../lib/cells/meeting-actions';
import type {
  Cell,
  ChannelCategory,
  Channel,
  CellMemberWithProfile,
  CellCall,
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
  const [channelMessages, setChannelMessages] = useState<Record<string, Message[]>>({
    [initialChannelId]: initialMessages,
  });
  const [localCategories, setLocalCategories] = useState<ChannelCategory[]>(categories);
  const [memberListOpen, setMemberListOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [createCategoryId, setCreateCategoryId] = useState<string>('');
  const [createStoryOpen, setCreateStoryOpen] = useState(false);

  const [meetingsData, setMeetingsData] = useState<Record<string, MeetingWithRsvps[]>>({});
  const [upcomingMeetingHints, setUpcomingMeetingHints] = useState<UpcomingMeetingHint[]>([]);
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ScheduledMeeting | null>(null);

  // Stage 4A — Voice call state
  const [activeCallByChannel, setActiveCallByChannel] = useState<Record<string, CellCall>>({});
  const [isInCall, setIsInCall] = useState(false);
  const [callRoomName, setCallRoomName] = useState<string | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const callRoomNameRef = useRef<string | null>(null);
  callRoomNameRef.current = callRoomName;

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

  // Stage 4C — Rehydrate active call for the initial channel on mount
  useEffect(() => {
    getActiveCall(initialChannelId).then((call) => {
      if (call) {
        setActiveCallByChannel((prev) => ({ ...prev, [call.channel_id]: call }));
      }
    });
  }, [initialChannelId]);

  // Stage 4B — Realtime subscription: Postgres Changes on cell_calls for this cell
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`call-state:${cell.id}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'cell_calls', filter: `cell_id=eq.${cell.id}` },
        (payload: { new: CellCall }) => {
          const call = payload.new;
          if (!call.ended_at) {
            setActiveCallByChannel((prev) => ({ ...prev, [call.channel_id]: call }));
          }
        }
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'UPDATE', schema: 'public', table: 'cell_calls', filter: `cell_id=eq.${cell.id}` },
        (payload: { new: CellCall }) => {
          const call = payload.new;
          if (call.ended_at) {
            setActiveCallByChannel((prev) => {
              const next = { ...prev };
              delete next[call.channel_id];
              return next;
            });
            // Exit call if user is in this room
            setCallRoomName((current) => {
              if (current === call.room_name) {
                setIsInCall(false);
                setActiveCallId(null);
                return null;
              }
              return current;
            });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [cell.id]);

  // Stage 4D handlers
  const handleStartOrJoinCall = useCallback(async () => {
    const existing = activeCallByChannel[activeChannelId];
    if (existing) {
      setCallRoomName(existing.room_name);
      setActiveCallId(existing.id);
      setIsInCall(true);
      return;
    }
    const result = await startCall(activeChannelId, cell.id);
    if ('error' in result) return;
    setActiveCallByChannel((prev) => ({ ...prev, [result.channel_id]: result }));
    setCallRoomName(result.room_name);
    setActiveCallId(result.id);
    setIsInCall(true);
  }, [activeCallByChannel, activeChannelId, cell.id]);

  const handleEndCall = useCallback(async () => {
    const callId = activeCallByChannel[activeChannelId]?.id ?? activeCallId;
    if (!callId) return;
    await endCall(callId, cell.id);
    setActiveCallByChannel((prev) => {
      const next = { ...prev };
      delete next[activeChannelId];
      return next;
    });
    setIsInCall(false);
    setCallRoomName(null);
    setActiveCallId(null);
  }, [activeCallByChannel, activeChannelId, activeCallId, cell.id]);

  const handleLeaveCall = useCallback(async () => {
    await handleEndCall();
  }, [handleEndCall]);

  const handleChannelSelect = useCallback(
    async (channelId: string) => {
      if (channelId === activeChannelId) return;

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

      // Update URL silently — no SSR triggered, back-button works
      window.history.replaceState(null, '', `/engage/${cell.slug}/${channelId}`);

      // Fetch messages for the new channel if not already cached
      if (!channelMessages[channelId]) {
        const msgs = await fetchChannelMessages(channelId);
        setChannelMessages((prev) => ({ ...prev, [channelId]: msgs }));
      }
    },
    [cell.slug, activeChannelId, channelMessages]
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
      {/* Stage 4D — Jitsi overlay (fixed, full-screen) */}
      {isInCall && callRoomName && (
        <JitsiCallScreen
          roomName={callRoomName}
          displayName={currentUser.username}
          avatarUrl={currentUser.avatar_url ?? undefined}
          onLeave={handleLeaveCall}
          onAutoEnd={handleEndCall}
        />
      )}
      {/* ── Slim header ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          height: 44,
          padding: '0 var(--space-2)',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          flexShrink: 0,
        }}
      >
        {/* Left: back */}
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
            padding: '4px 8px',
            justifyContent: 'flex-start',
          }}
        >
          <ChevronLeft size={20} />
        </button>
        {/* Center: name */}
        <span
          style={{
            fontSize: '0.9375rem',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          {cell.name}
        </span>
        {/* Right: call + members + more */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
          {(activeChannel?.channel_type === 'text' || activeChannel?.channel_type === 'announcement') && (
            <button
              onClick={handleStartOrJoinCall}
              aria-label="Start voice call"
              title={activeCallByChannel[activeChannelId] ? 'Join active call' : 'Start voice call'}
              style={{
                background: activeCallByChannel[activeChannelId] ? 'var(--color-accent-soft)' : 'none',
                border: 'none',
                color: activeCallByChannel[activeChannelId] ? 'var(--color-accent)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Phone size={15} />
            </button>
          )}
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
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', flexShrink: 0 }} />
            <Users size={13} />
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
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* ── Mobile channel pills (hidden on desktop) ── */}
      <div className="mobile-channel-pills">
        <div style={{ display: 'flex', gap: 6, padding: '6px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {allChannels.map((ch) => {
            const isActive = ch.id === activeChannelId;
            const unread = unreadCounts[ch.id] ?? 0;
            const isMeeting = ch.channel_type === 'meeting';
            const icon = ch.emoji
              ? ch.emoji
              : isMeeting
              ? <Calendar size={12} />
              : ch.channel_type === 'announcement'
              ? <Megaphone size={12} />
              : ch.channel_type === 'voice'
              ? <Phone size={12} />
              : <Hash size={12} />;
            return (
              <button
                key={ch.id}
                onClick={() => handleChannelSelect(ch.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: isActive ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: isActive ? 'var(--color-accent-text)' : unread > 0 ? 'var(--color-text)' : 'var(--color-text-muted)',
                  fontSize: '0.8125rem',
                  fontWeight: isActive || unread > 0 ? 600 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  position: 'relative',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: 12, opacity: 0.8 }}>{icon}</span>
                {ch.name}
                {unread > 0 && !isActive && (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--color-accent)',
                    flexShrink: 0,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {cell.banner_url && (
        <div
          style={{
            height: 80,
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src={cell.banner_url}
            alt=""
            style={{ width: '100%', height: '140%', objectFit: 'cover', display: 'block', objectPosition: 'center 30%' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(4,5,3,0.1) 0%, rgba(4,5,3,0.7) 70%, var(--color-bg) 100%)',
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

      {/* Stage 4D — Active call banner (shown when call exists and user hasn't joined) */}
      {activeCallByChannel[activeChannelId] && !isInCall && (
        <ActiveCallBanner
          call={activeCallByChannel[activeChannelId]}
          isInCall={isInCall}
          userRole={userRole}
          onJoin={handleStartOrJoinCall}
          onEnd={handleEndCall}
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

          {/* Stage 5C — Voice Channel Panel */}
          {activeChannel?.channel_type === 'voice' ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-6)',
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: activeCallByChannel[activeChannelId] ? 'var(--color-accent-soft)' : 'var(--color-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeCallByChannel[activeChannelId] ? 'var(--color-accent)' : 'var(--color-text-faint)',
                }}
              >
                <Phone size={36} />
              </div>

              {activeCallByChannel[activeChannelId] ? (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                      Call in progress
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                      Started by {activeCallByChannel[activeChannelId].started_by_name}
                    </p>
                  </div>
                  <button
                    onClick={handleStartOrJoinCall}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: '10px 28px',
                      background: 'var(--color-accent)',
                      border: 'none',
                      borderRadius: 'var(--radius-full)',
                      color: 'var(--color-accent-text)',
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <Phone size={16} />
                    Join Call
                  </button>
                </>
              ) : (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                      {activeChannel.name}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                      No active call
                    </p>
                  </div>
                  <button
                    onClick={handleStartOrJoinCall}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: '10px 28px',
                      background: 'var(--color-accent)',
                      border: 'none',
                      borderRadius: 'var(--radius-full)',
                      color: 'var(--color-accent-text)',
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <Phone size={16} />
                    Start Call
                  </button>
                </>
              )}
            </div>
          ) : (
            <Chat
              key={activeChannelId}
              cellId={cell.id}
              cellName={cell.name}
              cellAvatar={cell.avatar_url}
              currentUser={currentUser}
              initialMessages={channelMessages[activeChannelId] ?? initialMessages}
              blockedUserIds={blockedUserIds}
              userRole={userRole}
              channelId={activeChannelId}
              channelTopic={activeChannel?.topic ?? null}
              onMessageSent={handleMessageSent}
            />
          )}
        </div>
      </div>

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
        .mobile-channel-pills { display: flex; border-bottom: 1px solid var(--color-border); background: var(--color-bg); flex-shrink: 0; }
        .mobile-channel-pills div::-webkit-scrollbar { display: none; }
        @media (min-width: 980px) {
          .desktop-sidebar-shell { display: flex; }
          .mobile-channel-pills { display: none; }
        }
      `}</style>
    </div>
  );
}

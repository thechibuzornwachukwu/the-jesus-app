'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Users, MoreVertical, Paperclip, Send, Clock, Play, X } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { Avatar } from '../shared-ui/Avatar';
import { checkTone } from './ToneGuard';
import { AudioMessage } from './AudioMessage';
import { VoiceRecorder } from './VoiceRecorder';
import { MemberList } from './MemberList';
import { ScheduleSheet } from './ScheduleSheet';
import { ScheduledMessagesList } from './ScheduledMessagesList';
import { TimestampReplyBar } from './TimestampReplyBar';
import { scheduleMessage } from '../../lib/cells/actions';
import { logStreakEvent } from '../../lib/streaks/actions';
import { UserProfileSheet } from '../shared-ui/UserProfileSheet';
import type { Message, Profile } from '../../lib/cells/types';

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

interface ChatProps {
  cellId: string;
  cellName: string;
  cellAvatar?: string | null;
  memberCount?: number;
  currentUser: Profile;
  initialMessages: Message[];
  blockedUserIds?: string[];
  userRole?: 'admin' | 'member';
  channelId?: string;
  channelTopic?: string | null;
  onMessageSent?: () => void;
}

export function Chat({
  cellId,
  cellName,
  cellAvatar,
  memberCount,
  currentUser,
  initialMessages,
  blockedUserIds = [],
  userRole = 'member',
  channelId,
  onMessageSent,
}: ChatProps) {
  const router = useRouter();
  const blockedSet = React.useMemo(() => new Set(blockedUserIds), [blockedUserIds]);
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.filter((m) => !blockedUserIds.includes(m.user_id))
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [toneWarning, setToneWarning] = useState<{
    show: boolean;
    suggestion?: string;
    pendingContent?: string;
    hardBlock?: boolean;
    message?: string;
  }>({ show: false });
  const [sendError, setSendError] = useState<{ message: string; code?: string } | null>(null);
  const [memberListOpen, setMemberListOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [sendMenuOpen, setSendMenuOpen] = useState(false);
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false);
  const [scheduledListOpen, setScheduledListOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [liveMemberCount, setLiveMemberCount] = useState<number | undefined>(memberCount);
  const [onlineMemberIds, setOnlineMemberIds] = useState<Set<string>>(
    new Set([currentUser.id])
  );
  const [replyState, setReplyState] = useState<{
    messageId: string;
    timestampSeconds: number;
    username: string;
  } | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [profileSheetUserId, setProfileSheetUserId] = useState<string | null>(null);

  // Long-press timer ref for send button
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [typingByUser, setTypingByUser] = useState<Record<string, number>>({});

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilesCache = useRef<Map<string, Profile>>(new Map([[currentUser.id, currentUser]]));
  const typingHeartbeatRef = useRef<number>(0);

  useEffect(() => {
    initialMessages.forEach((m) => {
      if (m.profiles && !profilesCache.current.has(m.user_id)) {
        profilesCache.current.set(m.user_id, {
          id: m.user_id,
          username: m.profiles.username,
          avatar_url: m.profiles.avatar_url ?? null,
        });
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // D4: Keyboard-aware scroll — when the virtual keyboard opens on iOS/Android,
  // the visualViewport shrinks. Instantly snap the message list to the bottom
  // so the input stays above the keyboard without manual scrolling.
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return;
    const onViewportResize = () => {
      // Small delay lets the layout settle before we measure
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'instant' });
      });
    };
    vv.addEventListener('resize', onViewportResize);
    return () => vv.removeEventListener('resize', onViewportResize);
  }, []);

  // Realtime member count
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`members:${cellId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cell_members', filter: `cell_id=eq.${cellId}` },
        () => setLiveMemberCount((c) => (c ?? 0) + 1)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'cell_members', filter: `cell_id=eq.${cellId}` },
        () => setLiveMemberCount((c) => Math.max((c ?? 1) - 1, 0))
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [cellId]);

  // Realtime chat messages
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat:${cellId}:${channelId ?? 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: channelId ? `channel_id=eq.${channelId}` : `cell_id=eq.${cellId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Omit<Message, 'profiles'>;

          let profile = profilesCache.current.get(newMsg.user_id);
          if (!profile) {
            const { data } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', newMsg.user_id)
              .single();
            if (data) {
              profile = data as Profile;
              profilesCache.current.set(data.id, profile);
            }
          }

          if (blockedSet.has(newMsg.user_id)) return;

          const fullMsg: Message = {
            ...(newMsg as Message),
            profiles: profile
              ? { username: profile.username, avatar_url: profile.avatar_url }
              : undefined,
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === fullMsg.id)) return prev;

            if (fullMsg.client_nonce) {
              const optimisticIndex = prev.findIndex(
                (m) => m.id === fullMsg.client_nonce || m.client_nonce === fullMsg.client_nonce
              );
              if (optimisticIndex >= 0) {
                const next = [...prev];
                next[optimisticIndex] = fullMsg;
                return next;
              }
            }

            return [...prev, fullMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cellId, channelId, currentUser.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime Presence
  useEffect(() => {
    const supabase = createClient();

    const presenceChannel = supabase.channel(`presence:${cellId}`, {
      config: { presence: { key: currentUser.id } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<{ user_id: string }>();
        setOnlineMemberIds(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: currentUser.id, online_at: Date.now() });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [cellId, currentUser.id]);

  useEffect(() => {
    if (!channelId) return;
    const supabase = createClient();

    const refreshTypingUsers = async () => {
      const { data } = await supabase
        .from('channel_typing_presence')
        .select('user_id, expires_at')
        .eq('channel_id', channelId)
        .gt('expires_at', new Date().toISOString());

      const next: Record<string, number> = {};
      for (const row of (data ?? []) as { user_id: string; expires_at: string }[]) {
        if (row.user_id === currentUser.id) continue;
        next[row.user_id] = new Date(row.expires_at).getTime();
      }
      setTypingByUser(next);
    };

    void refreshTypingUsers();

    const typingChannel = supabase
      .channel(`typing:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channel_typing_presence',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const row = ((payload.new ?? payload.old) as { user_id: string; expires_at?: string }) ?? null;
          if (!row || row.user_id === currentUser.id) return;

          if (!profilesCache.current.has(row.user_id)) {
            const { data } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', row.user_id)
              .single();
            if (data) profilesCache.current.set(data.id, data as Profile);
          }

          setTypingByUser((prev) => {
            if (payload.eventType === 'DELETE' || !row.expires_at) {
              const next = { ...prev };
              delete next[row.user_id];
              return next;
            }
            const expiresMs = new Date(row.expires_at).getTime();
            if (expiresMs <= Date.now()) {
              const next = { ...prev };
              delete next[row.user_id];
              return next;
            }
            return { ...prev, [row.user_id]: expiresMs };
          });
        }
      )
      .subscribe();

    const pruneInterval = setInterval(() => {
      setTypingByUser((prev) => {
        const now = Date.now();
        let changed = false;
        const next: Record<string, number> = {};
        for (const [userId, expiresMs] of Object.entries(prev)) {
          if (expiresMs > now) next[userId] = expiresMs;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 2000);

    return () => {
      clearInterval(pruneInterval);
      supabase.removeChannel(typingChannel);
    };
  }, [channelId, currentUser.id]);

  const handleTimestampReply = useCallback(
    (messageId: string, timestampSeconds: number) => {
      const msg = messages.find((m) => m.id === messageId);
      setReplyState({
        messageId,
        timestampSeconds,
        username: msg?.profiles?.username ?? 'Unknown',
      });
      textareaRef.current?.focus();
    },
    [messages]
  );

  const scrollToMessage = useCallback((msgId: string) => {
    const el = document.querySelector(`[data-message-id="${msgId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(msgId);
    setTimeout(() => setHighlightedId(null), 1200);
  }, []);

  const stopTyping = useCallback(async () => {
    if (!channelId) return;
    const supabase = createClient();
    await supabase
      .from('channel_typing_presence')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', currentUser.id);
  }, [channelId, currentUser.id]);

  const pulseTyping = useCallback(async () => {
    if (!channelId) return;
    const now = Date.now();
    if (now - typingHeartbeatRef.current < 3000) return;
    typingHeartbeatRef.current = now;
    const supabase = createClient();
    const expiresAt = new Date(now + 12_000).toISOString();
    await supabase.from('channel_typing_presence').upsert(
      {
        user_id: currentUser.id,
        cell_id: cellId,
        channel_id: channelId,
        started_at: new Date(now).toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: 'user_id,channel_id' }
    );
  }, [cellId, channelId, currentUser.id]);

  useEffect(() => {
    return () => {
      void stopTyping();
    };
  }, [stopTyping]);

  const sendMessage = useCallback(
    async (content: string, skipToneCheck = false) => {
      if (!content.trim() || sending) return;
      setSendError(null);

      if (!skipToneCheck) {
        const tone = await checkTone(content, cellId);
        if (!tone.pass) {
          setToneWarning({
            show: true,
            suggestion: tone.suggestion,
            pendingContent: content,
            hardBlock: tone.hardBlock,
            message: tone.message,
          });
          return;
        }
      }

      setSending(true);
      const tempId = `temp-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        cell_id: cellId,
        user_id: currentUser.id,
        content,
        message_type: 'text',
        audio_url: null,
        image_url: null,
        channel_id: channelId ?? null,
        client_nonce: tempId,
        created_at: new Date().toISOString(),
        reply_to_message_id: replyState?.messageId ?? null,
        reply_to_timestamp_seconds: replyState?.timestampSeconds ?? null,
        profiles: { username: currentUser.username, avatar_url: currentUser.avatar_url },
      };

      setMessages((prev) => [...prev, optimistic]);
      setInput('');
      setReplyState(null);
      setToneWarning({ show: false });
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      const supabase = createClient();
      const { error } = await supabase.from('chat_messages').insert({
        cell_id: cellId,
        user_id: currentUser.id,
        content,
        message_type: 'text',
        channel_id: channelId ?? null,
        client_nonce: tempId,
        ...(replyState && {
          reply_to_message_id: replyState.messageId,
          reply_to_timestamp_seconds: replyState.timestampSeconds,
        }),
      });

      if (error) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setSendError({ message: 'Failed to send. Please try again.', code: error.code });
      } else {
        void logStreakEvent('cell_message');
        if (content.includes('@')) {
          const mentionMatches = content.match(/@(\w+)/g) ?? [];
          if (mentionMatches.length > 0) {
            import('../../lib/profile/actions').then(({ notifyMention }) => {
              mentionMatches.forEach((mention) => {
                const username = mention.slice(1);
                const mentioned = [...profilesCache.current.values()].find(
                  (p) => p.username === username
                );
                if (mentioned) {
                  notifyMention(cellId, mentioned.id, content.slice(0, 80));
                }
              });
            });
          }
        }
        onMessageSent?.();
      }
      setSending(false);
      void stopTyping();
    },
    [cellId, channelId, currentUser, sending, onMessageSent, replyState, stopTyping]
  );

  const handleSend = () => {
    setSendMenuOpen(false);
    sendMessage(input);
  };

  const handleSchedule = async (sendAt: string) => {
    if (!input.trim()) return;
    setScheduling(true);
    const result = await scheduleMessage(cellId, input.trim(), sendAt, channelId);
    setScheduling(false);
    if (!('error' in result)) {
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      setScheduleSheetOpen(false);
    }
  };

  const handleSendPointerDown = () => {
    if (!input.trim()) return;
    longPressTimer.current = setTimeout(() => {
      setSendMenuOpen(true);
    }, 480);
  };

  const handleSendPointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleSendAnyway = async () => {
    if (toneWarning.pendingContent) {
      await sendMessage(toneWarning.pendingContent, true);
    }
  };

  const handleAudioReady = async (blob: Blob, mimeType: string) => {
    const supabase = createClient();
    const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'ogg';
    const path = `${cellId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-audio')
      .upload(path, blob, { contentType: mimeType });

    if (uploadError) {
      setSendError({ message: 'Failed to upload voice message.', code: uploadError.error ?? undefined });
      return;
    }

    const { data: signedData } = await supabase.storage
      .from('chat-audio')
      .createSignedUrl(path, 3600);

    if (!signedData?.signedUrl) {
      setSendError({ message: 'Failed to process voice message.' });
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      cell_id: cellId,
      user_id: currentUser.id,
      content: null,
      message_type: 'audio',
      audio_url: signedData.signedUrl,
      image_url: null,
      channel_id: channelId ?? null,
      client_nonce: tempId,
      created_at: new Date().toISOString(),
      profiles: { username: currentUser.username, avatar_url: currentUser.avatar_url },
    };
    setMessages((prev) => [...prev, optimistic]);

    const { error: insertError } = await supabase.from('chat_messages').insert({
      cell_id: cellId,
      user_id: currentUser.id,
      content: null,
      message_type: 'audio',
      audio_url: signedData.signedUrl,
      channel_id: channelId ?? null,
      client_nonce: tempId,
    });

    if (insertError) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setSendError({ message: 'Failed to send voice message.', code: insertError.code });
    }
  };

  const handleImageSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset so same file can be re-selected if needed
      e.target.value = '';

      const isGif = file.type === 'image/gif';
      const messageType = isGif ? 'gif' : 'image';

      // Optimistic preview using object URL
      const objectUrl = URL.createObjectURL(file);
      const tempId = `temp-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        cell_id: cellId,
        user_id: currentUser.id,
        content: null,
        message_type: messageType,
        audio_url: null,
        image_url: objectUrl,
        channel_id: channelId ?? null,
        client_nonce: tempId,
        created_at: new Date().toISOString(),
        profiles: { username: currentUser.username, avatar_url: currentUser.avatar_url },
      };
      setMessages((prev) => [...prev, optimistic]);
      setImageUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('cellId', cellId);
      if (channelId) formData.append('channelId', channelId);

      const res = await fetch('/api/cells/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        URL.revokeObjectURL(objectUrl);
        setSendError({ message: 'Failed to upload image.' });
        setImageUploading(false);
        return;
      }

      const { signedUrl } = await res.json();

      const supabase = createClient();
      const { error: insertError } = await supabase.from('chat_messages').insert({
        cell_id: cellId,
        user_id: currentUser.id,
        content: null,
        message_type: messageType,
        image_url: signedUrl,
        channel_id: channelId ?? null,
        client_nonce: tempId,
      });

      URL.revokeObjectURL(objectUrl);
      if (insertError) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setSendError({ message: 'Failed to send image.', code: insertError.code });
      }
      setImageUploading(false);
    },
    [cellId, channelId, currentUser]
  );

  const onlineCount = onlineMemberIds.size;
  const typingNames = Object.keys(typingByUser)
    .map((userId) => profilesCache.current.get(userId)?.username)
    .filter(Boolean) as string[];
  const typingLabel =
    typingNames.length === 0
      ? ''
      : typingNames.length === 1
        ? `${typingNames[0]} is typing...`
        : `${typingNames.slice(0, 2).join(', ')}${typingNames.length > 2 ? ` +${typingNames.length - 2}` : ''} are typing...`;

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100dvh - var(--nav-height) - var(--safe-bottom) - var(--safe-top))',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            flexShrink: 0,
            height: 52,
          }}
        >
          <button
            onClick={() => router.back()}
            aria-label="Back"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent)',
              cursor: 'pointer',
              padding: 'var(--space-1)',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={22} />
          </button>

          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <Avatar src={cellAvatar} name={cellName} size={32} />
          </div>

          <span
            style={{
              fontWeight: 'var(--font-weight-semibold)',
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text)',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {cellName}
          </span>

          {/* Member count  tappable to open member list */}
          {liveMemberCount !== undefined && (
            <button
              onClick={() => setMemberListOpen(true)}
              aria-label="View members"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-xs)',
                flexShrink: 0,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 'var(--space-1)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Users size={14} />
              <span>{liveMemberCount}</span>
              {onlineCount > 1 && (
                <span style={{ color: 'var(--color-success)' }}>· {onlineCount} online</span>
              )}
            </button>
          )}

          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setHeaderMenuOpen((v) => !v)}
              aria-label="More options"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: 'var(--space-1)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <MoreVertical size={18} />
            </button>
            {headerMenuOpen && (
              <>
                <div
                  onClick={() => setHeaderMenuOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    zIndex: 91,
                    minWidth: 160,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      setScheduledListOpen(true);
                    }}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      color: 'var(--color-text)',
                      fontSize: 'var(--font-size-sm)',
                      textAlign: 'left',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <Clock size={14} color="var(--color-accent)" />
                    Scheduled
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingTop: 'var(--space-4)',
            paddingBottom: 'var(--space-2)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {messages.length === 0 && (
            <p
              style={{
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)',
                textAlign: 'center',
                paddingTop: 'var(--space-8)',
              }}
            >
              No messages yet. Say hello!
            </p>
          )}
          {messages.map((msg, idx) => {
            const prev = idx > 0 ? messages[idx - 1] : null;
            const isContinuation =
              prev !== null &&
              prev.user_id === msg.user_id &&
              new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() <
                5 * 60 * 1000;
            return (
              <DiscordMessage
                key={msg.id}
                msg={msg}
                isOwn={msg.user_id === currentUser.id}
                isContinuation={isContinuation}
                isOnline={onlineMemberIds.has(msg.user_id)}
                isHighlighted={highlightedId === msg.id}
                allMessages={messages}
                onTimestampReply={handleTimestampReply}
                onScrollToMessage={scrollToMessage}
                onOpenLightbox={setLightboxUrl}
                onAvatarPress={
                  msg.user_id !== currentUser.id
                    ? (uid) => setProfileSheetUserId(uid)
                    : undefined
                }
              />
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input area — padding-bottom absorbs iPhone home indicator */}
        <div
          style={{
            padding: 'var(--space-2) var(--space-3) var(--space-3)',
            paddingBottom: 'calc(var(--space-3) + var(--safe-bottom))',
            background: 'var(--color-bg)',
            flexShrink: 0,
          }}
        >
          {/* Timestamp reply bar */}
          {replyState && (
            <TimestampReplyBar
              username={replyState.username}
              timestampSeconds={replyState.timestampSeconds}
              onDismiss={() => setReplyState(null)}
            />
          )}

          {/* Tone warning chip */}
          {toneWarning.show && (
            <div
              style={{
                marginBottom: 'var(--space-2)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-2) var(--space-3)',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  flex: 1,
                  lineHeight: 'var(--line-height-normal)',
                }}
              >
                {toneWarning.message ?? 'Speak with grace.'}
                {toneWarning.suggestion ? ` Try: "${toneWarning.suggestion}"` : ''}
              </span>
              <button
                onClick={() => setToneWarning({ show: false })}
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                Edit
              </button>
              {!toneWarning.hardBlock && (
                <button
                  onClick={handleSendAnyway}
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-accent)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  Send anyway
                </button>
              )}
            </div>
          )}

          {sendError && (
            <div
              style={{
                marginBottom: 'var(--space-1)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                color: 'var(--color-error)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              <span>{sendError.message}</span>
              {sendError.code && (
                <code
                  title="Tap to copy error code"
                  onClick={() => navigator.clipboard?.writeText(sendError.code!).catch(() => {})}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 10,
                    padding: '2px 5px',
                    borderRadius: 3,
                    background: 'rgba(248,113,113,0.12)',
                    border: '1px solid rgba(248,113,113,0.25)',
                    cursor: 'copy',
                    userSelect: 'all',
                  }}
                >
                  {sendError.code}
                </code>
              )}
            </div>
          )}
          {typingLabel && (
            <p
              style={{
                marginBottom: 'var(--space-1)',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {typingLabel}
            </p>
          )}

          {/* Discord pill input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              background: 'var(--color-surface-high)',
              borderRadius: 'var(--radius-full)',
              padding: '4px var(--space-2) 4px 4px',
              gap: 2,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />
            <button
              aria-label="Attach image"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: 'transparent',
                cursor: imageUploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: imageUploading ? 'var(--color-accent)' : 'var(--color-text-muted)',
                flexShrink: 0,
                opacity: imageUploading ? 0.6 : 1,
              }}
            >
              {imageUploading ? (
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'chat-spin 0.6s linear infinite',
                  }}
                />
              ) : (
                <Paperclip size={18} />
              )}
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                const value = e.target.value;
                setInput(value);
                if (value.trim().length > 0) {
                  void pulseTyping();
                } else {
                  void stopTyping();
                }
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Share something with grace…"
              rows={1}
              className="field-textarea"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                fontSize: 'var(--font-size-base)',
                maxHeight: '80px',
                overflowY: 'auto',
                padding: '8px 4px',
                alignSelf: 'flex-end',
              }}
            />

            <VoiceRecorder onAudioReady={handleAudioReady} />

            {/* Send button with long-press context menu */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {sendMenuOpen && (
                <>
                  <div
                    onClick={() => setSendMenuOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      right: 0,
                      marginBottom: 6,
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      zIndex: 91,
                      overflow: 'hidden',
                      minWidth: 150,
                    }}
                  >
                    <button
                      onClick={handleSend}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3) var(--space-4)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        color: 'var(--color-text)',
                        fontSize: 'var(--font-size-sm)',
                        textAlign: 'left',
                        fontFamily: 'var(--font-sans)',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <Send size={13} color="var(--color-accent)" />
                      Send Now
                    </button>
                    <button
                      onClick={() => {
                        setSendMenuOpen(false);
                        setScheduleSheetOpen(true);
                      }}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3) var(--space-4)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        color: 'var(--color-text)',
                        fontSize: 'var(--font-size-sm)',
                        textAlign: 'left',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      <Clock size={13} color="var(--color-accent)" />
                      Schedule
                    </button>
                  </div>
                </>
              )}

              <button
                onClick={!sendMenuOpen ? handleSend : undefined}
                onPointerDown={handleSendPointerDown}
                onPointerUp={handleSendPointerUp}
                onPointerLeave={handleSendPointerUp}
                disabled={!input.trim() || sending}
                aria-label="Send message"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: input.trim() ? 'var(--color-accent)' : 'transparent',
                  cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: input.trim() ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {sending ? (
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid currentColor',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'chat-spin 0.6s linear infinite',
                    }}
                  />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes chat-spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>

      {/* Member list sheet */}
      <MemberList
        open={memberListOpen}
        onClose={() => setMemberListOpen(false)}
        cellId={cellId}
        currentUserId={currentUser.id}
        userRole={userRole}
        onlineMemberIds={onlineMemberIds}
      />

      {/* Schedule sheet */}
      <ScheduleSheet
        open={scheduleSheetOpen}
        onClose={() => setScheduleSheetOpen(false)}
        content={input}
        onSchedule={handleSchedule}
        loading={scheduling}
      />

      {/* Scheduled messages list */}
      <ScheduledMessagesList
        open={scheduledListOpen}
        onClose={() => setScheduledListOpen(false)}
        cellId={cellId}
      />

      {/* Image lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 'calc(var(--safe-top) + 12px)',
              right: 16,
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Full size"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '100%',
              maxHeight: '90dvh',
              objectFit: 'contain',
              borderRadius: 'var(--radius-md)',
            }}
          />
        </div>
      )}

      {/* User profile sheet */}
      <UserProfileSheet
        open={!!profileSheetUserId}
        onClose={() => setProfileSheetUserId(null)}
        userId={profileSheetUserId}
      />
    </>
  );
}

function DiscordMessage({
  msg,
  isOwn,
  isContinuation,
  isOnline,
  isHighlighted = false,
  allMessages = [],
  onTimestampReply,
  onScrollToMessage,
  onOpenLightbox,
  onAvatarPress,
}: {
  msg: Message;
  isOwn: boolean;
  isContinuation: boolean;
  isOnline: boolean;
  isHighlighted?: boolean;
  allMessages?: Message[];
  onTimestampReply?: (messageId: string, seconds: number) => void;
  onScrollToMessage?: (msgId: string) => void;
  onOpenLightbox?: (url: string) => void;
  onAvatarPress?: (userId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const referencedMsg = msg.reply_to_message_id
    ? allMessages.find((m) => m.id === msg.reply_to_message_id) ?? null
    : null;

  return (
    <div
      data-message-id={msg.id}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        gap: 'var(--space-3)',
        padding: isContinuation
          ? '1px var(--space-4) 1px var(--space-4)'
          : 'var(--space-2) var(--space-4) var(--space-1)',
        background: isHighlighted
          ? 'rgba(212,146,42,0.12)'
          : hovered
            ? isOwn
              ? 'rgba(212,146,42,0.05)'
              : 'rgba(245,247,247,0.03)'
            : 'transparent',
        transition: 'background 0.2s',
      }}
    >
      {/* Avatar column (36px wide) */}
      <div
        style={{
          width: 36,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: isContinuation ? 2 : 0,
        }}
      >
        {isContinuation ? (
          <span
            style={{
              fontSize: '0.625rem',
              color: 'var(--color-text-faint)',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.1s',
              whiteSpace: 'nowrap',
              lineHeight: 1,
              paddingTop: 2,
            }}
          >
            {formatTime(msg.created_at)}
          </span>
        ) : (
          <div
            style={{ position: 'relative', cursor: onAvatarPress ? 'pointer' : 'default' }}
            onClick={() => onAvatarPress?.(msg.user_id)}
            role={onAvatarPress ? 'button' : undefined}
            aria-label={onAvatarPress ? `View ${msg.profiles?.username ?? 'user'}'s profile` : undefined}
          >
            <Avatar src={msg.profiles?.avatar_url} name={msg.profiles?.username} size={36} />
            {isOnline && (
              <span
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: 'var(--color-success)',
                  border: '2px solid var(--color-bg)',
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!isContinuation && (
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-2)',
              marginBottom: 2,
            }}
          >
            <span
              onClick={() => !isOwn && onAvatarPress?.(msg.user_id)}
              style={{
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: 'var(--font-size-sm)',
                color: isOwn ? 'var(--color-accent)' : 'var(--color-text)',
                cursor: !isOwn && onAvatarPress ? 'pointer' : 'default',
              }}
            >
              {isOwn ? 'You' : (msg.profiles?.username ?? 'Unknown')}
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-faint)',
                opacity: 0.4,
              }}
            >
              {formatTime(msg.created_at)}
            </span>
          </div>
        )}

        {/* Quoted reply preview */}
        {referencedMsg && (
          <div
            onClick={() => onScrollToMessage?.(referencedMsg.id)}
            style={{
              marginBottom: 4,
              padding: '4px 8px',
              borderLeft: '3px solid var(--color-accent)',
              background: 'rgba(245,247,247,0.05)',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              cursor: 'pointer',
              maxWidth: 260,
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-accent)',
                display: 'block',
              }}
            >
              {referencedMsg.profiles?.username ?? 'Unknown'}
            </span>
            {referencedMsg.message_type === 'audio' ? (
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Play size={9} />
                Voice note
                {msg.reply_to_timestamp_seconds != null &&
                  ` · ${Math.floor(msg.reply_to_timestamp_seconds / 60)}:${String(Math.floor(msg.reply_to_timestamp_seconds % 60)).padStart(2, '0')}`}
              </span>
            ) : (
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {referencedMsg.content}
              </span>
            )}
          </div>
        )}

        {msg.message_type === 'audio' && msg.audio_url ? (
          <AudioMessage
            audioUrl={msg.audio_url}
            messageId={msg.id}
            onTimestampReply={onTimestampReply}
          />
        ) : (msg.message_type === 'image' || msg.message_type === 'gif') && msg.image_url ? (
          <ImageMessage
            url={msg.image_url}
            isGif={msg.message_type === 'gif'}
            onTap={() => onOpenLightbox?.(msg.image_url!)}
          />
        ) : (
          <p
            style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text)',
              lineHeight: 'var(--line-height-normal)',
              wordBreak: 'break-word',
              margin: 0,
            }}
          >
            {msg.content}
          </p>
        )}
      </div>
    </div>
  );
}

function ImageMessage({
  url,
  isGif,
  onTap,
}: {
  url: string;
  isGif: boolean;
  onTap: () => void;
}) {
  return (
    <div
      style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
      onClick={onTap}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={isGif ? 'GIF' : 'Image'}
        loading="lazy"
        style={{
          maxWidth: 320,
          maxHeight: 260,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'block',
          objectFit: 'cover',
        }}
      />
      {isGif && (
        <span
          style={{
            position: 'absolute',
            bottom: 6,
            left: 6,
            background: 'rgba(0,0,0,0.65)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.05em',
            padding: '2px 5px',
            borderRadius: 4,
            lineHeight: 1.4,
            pointerEvents: 'none',
          }}
        >
          GIF
        </span>
      )}
    </div>
  );
}

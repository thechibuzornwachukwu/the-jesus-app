'use client';

import React, { useState } from 'react';
import { Bell, Settings } from 'lucide-react';
import {
  ProfileHeader,
  ContentTabs,
  NotificationCenter,
  SettingsPanel,
} from '../../../libs/profile';
import { StreakWidget } from '../../../libs/profile/StreakWidget';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../../lib/profile/actions';
import type {
  FullProfile,
  SavedVerse,
  JoinedCell,
  PostedVideo,
  Post,
  AppNotification,
} from '../../../libs/profile/types';
import type { StreakData } from '../../../lib/profile/actions';

interface ProfileClientProps {
  profile: FullProfile;
  savedVerses: SavedVerse[];
  joinedCells: JoinedCell[];
  postedVideos: PostedVideo[];
  posts: Post[];
  unreadCount: number;
  blockedUserIds: string[];
  friendCount: number;
  streakData: StreakData;
}

export function ProfileClient({
  profile: initialProfile,
  savedVerses,
  joinedCells,
  postedVideos,
  posts,
  unreadCount: initialUnread,
  blockedUserIds: initialBlocked,
  friendCount,
  streakData,
}: ProfileClientProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [notifLoaded, setNotifLoaded] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState(initialBlocked);

  async function openNotifications() {
    if (!notifLoaded) {
      const data = await getNotifications();
      setNotifications(data);
      setNotifLoaded(true);
    }
    setNotifOpen(true);
  }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  function handleUnblock(id: string) {
    setBlockedUserIds((prev) => prev.filter((b) => b !== id));
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: 'var(--color-bg-primary)',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-4) var(--space-2)',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text)',
          }}
        >
          {profile.username}
        </h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          {/* Bell */}
          <button
            onClick={openNotifications}
            aria-label="Notifications"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text)',
              padding: 'var(--space-2)',
              position: 'relative',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 16,
                  height: 16,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-accent)',
                  color: '#fff',
                  fontSize: '0.6rem',
                  fontWeight: 'var(--font-weight-bold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Gear */}
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text)',
              padding: 'var(--space-2)',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Settings size={22} />
          </button>
        </div>
      </div>

      {/* Profile Header (Instagram-style) */}
      <ProfileHeader
        profile={profile}
        friendCount={friendCount}
        streakCount={streakData.current}
      />

      {/* Streak Widget */}
      <StreakWidget
        current={streakData.current}
        longest={streakData.longest}
        totalPoints={streakData.totalPoints}
        weeklyActivity={streakData.weeklyActivity}
      />

      {/* Content Tabs */}
      <div style={{ marginTop: 'var(--space-4)' }}>
        <ContentTabs
          savedVerses={savedVerses}
          joinedCells={joinedCells}
          postedVideos={postedVideos}
          posts={posts}
          streak={streakData.current}
          longestStreak={streakData.longest}
        />
      </div>

      {/* Overlays */}
      <NotificationCenter
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkAll={handleMarkAll}
        onMarkRead={handleMarkRead}
      />

      <SettingsPanel
        profile={profile}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onProfileUpdate={setProfile}
        blockedUserIds={blockedUserIds}
        onUnblock={handleUnblock}
      />
    </div>
  );
}

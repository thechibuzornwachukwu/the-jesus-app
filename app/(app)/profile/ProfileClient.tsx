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
    <>
      <style>{`
        @keyframes profile-slide-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .profile-section {
          animation: profile-slide-up 0.35s ease both;
        }
        .profile-section:nth-child(1) { animation-delay: 0ms; }
        .profile-section:nth-child(2) { animation-delay: 60ms; }
        .profile-section:nth-child(3) { animation-delay: 120ms; }
        .profile-section:nth-child(4) { animation-delay: 180ms; }
        .profile-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text);
          padding: var(--space-2);
          position: relative;
          line-height: 1;
          display: flex;
          align-items: center;
          border-radius: var(--radius-full);
          transition: background 0.15s, color 0.15s, transform 0.1s;
        }
        .profile-icon-btn:hover {
          background: var(--color-accent-soft);
          color: var(--color-accent);
        }
        .profile-icon-btn:active {
          transform: scale(0.93);
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          background: 'var(--color-bg)',
        }}
      >
        {/* Top bar */}
        <div
          className="profile-section"
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
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 900,
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text)',
            }}
          >
            Profile
          </h1>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            {/* Bell */}
            <button
              className="profile-icon-btn"
              onClick={openNotifications}
              aria-label="Notifications"
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
              className="profile-icon-btn"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
            >
              <Settings size={22} />
            </button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="profile-section">
          <ProfileHeader
            profile={profile}
            friendCount={friendCount}
            streakCount={streakData.current}
          />
        </div>

        {/* Streak Widget */}
        <div className="profile-section">
          <StreakWidget
            current={streakData.current}
            longest={streakData.longest}
            totalPoints={streakData.totalPoints}
            weeklyActivity={streakData.weeklyActivity}
          />
        </div>

        {/* Content Tabs */}
        <div className="profile-section" style={{ marginTop: 'var(--space-4)' }}>
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
    </>
  );
}

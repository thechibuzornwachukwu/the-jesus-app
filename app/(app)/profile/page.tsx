import { redirect } from 'next/navigation';
import {
  getFullProfile,
  getSavedVerses,
  getJoinedCells,
  getPostedVideos,
  getUserPosts,
  getUnreadCount,
  getBlockedUsers,
  getStreakData,
  getFollowCounts,
} from '../../../lib/profile/actions';
import { ProfileClient } from './ProfileClient';

export const metadata = { title: 'Profile  The JESUS App' };

export default async function ProfilePage() {
  const [
    profile,
    savedVerses,
    joinedCells,
    postedVideos,
    posts,
    unreadCount,
    blockedUserIds,
    followCounts,
    streakData,
  ] = await Promise.all([
    getFullProfile(),
    getSavedVerses(),
    getJoinedCells(),
    getPostedVideos(),
    getUserPosts(),
    getUnreadCount(),
    getBlockedUsers(),
    getFollowCounts(),
    getStreakData(),
  ]);

  if (!profile) redirect('/setup-profile');

  return (
    <ProfileClient
      profile={profile}
      savedVerses={savedVerses}
      joinedCells={joinedCells}
      postedVideos={postedVideos}
      posts={posts}
      unreadCount={unreadCount}
      blockedUserIds={blockedUserIds}
      followerCount={followCounts.follower_count}
      followingCount={followCounts.following_count}
      streakData={streakData}
    />
  );
}

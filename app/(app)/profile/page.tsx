import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import {
  getFullProfile,
  getSavedVerses,
  getJoinedCells,
  getPostedVideos,
  getUserPosts,
  getUnreadCount,
  getBlockedUsers,
  getStreakData,
} from '../../../lib/profile/actions';
import { getFriendCount } from '../../../lib/friends/actions';
import { ProfileClient } from './ProfileClient';

export const metadata = { title: 'Profile  The JESUS App' };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const [
    profile,
    savedVerses,
    joinedCells,
    postedVideos,
    posts,
    unreadCount,
    blockedUserIds,
    friendCount,
    streakData,
  ] = await Promise.all([
    getFullProfile(),
    getSavedVerses(),
    getJoinedCells(),
    getPostedVideos(),
    getUserPosts(),
    getUnreadCount(),
    getBlockedUsers(),
    getFriendCount(),
    getStreakData(),
  ]);

  if (!profile) redirect('/sign-in');

  return (
    <ProfileClient
      profile={profile}
      savedVerses={savedVerses}
      joinedCells={joinedCells}
      postedVideos={postedVideos}
      posts={posts}
      unreadCount={unreadCount}
      blockedUserIds={blockedUserIds}
      friendCount={friendCount}
      streakData={streakData}
    />
  );
}

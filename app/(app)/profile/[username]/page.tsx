import { redirect, notFound } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import {
  getFullProfile,
  getPublicProfile,
  getSavedVerses,
  getPostedVideos,
  getUserPosts,
  getUnreadCount,
  getStreakData,
  getFollowCounts,
} from '../../../../lib/profile/actions';
import { ProfilePageClient } from './ProfilePageClient';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  return { title: `@${username} · The JESUS App` };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();

  if (!me) redirect('/sign-in');

  const { data: myRow } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', me.id)
    .single();

  const isOwner = myRow?.username === username;

  if (isOwner) {
    const [profile, savedVerses, postedVideos, posts, unreadCount, followCounts, streakData] =
      await Promise.all([
        getFullProfile(),
        getSavedVerses(),
        getPostedVideos(),
        getUserPosts(),
        getUnreadCount(),
        getFollowCounts(),
        getStreakData(),
      ]);

    if (!profile) redirect('/sign-in');

    return (
      <ProfilePageClient
        isOwner
        profile={profile}
        savedVerses={savedVerses}
        postedVideos={postedVideos}
        posts={posts}
        unreadCount={unreadCount}
        followerCount={followCounts.follower_count}
        followingCount={followCounts.following_count}
        streakData={streakData}
        viewerId={me.id}
      />
    );
  }

  // Visitor view
  const publicProfile = await getPublicProfile(username);
  if (!publicProfile) notFound();

  const showContent = publicProfile.is_public || publicProfile.is_following;
  const [postedVideos, posts] = showContent
    ? await Promise.all([getPostedVideos(publicProfile.id), getUserPosts(publicProfile.id)])
    : [[], []];

  return (
    <ProfilePageClient
      isOwner={false}
      profile={{
        id: publicProfile.id,
        username: publicProfile.username,
        avatar_url: publicProfile.avatar_url,
        bio: publicProfile.bio,
        church_name: publicProfile.church_name,
        city: publicProfile.city,
        is_public: publicProfile.is_public,
        content_categories: [],
        deleted_at: null,
      }}
      postedVideos={postedVideos}
      posts={posts}
      savedVerses={[]}
      unreadCount={0}
      followerCount={publicProfile.follower_count}
      followingCount={publicProfile.following_count}
      streakData={{ current: 0, longest: 0, totalPoints: 0, weeklyActivity: [] }}
      viewerId={me.id}
      isFollowing={publicProfile.is_following}
    />
  );
}

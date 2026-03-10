import { redirect, notFound } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import {
  getPublicProfile,
  getPostedVideos,
  getUserPosts,
} from '../../../../lib/profile/actions';
import { PublicProfileClient } from './PublicProfileClient';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  return { title: `@${username} · The JESUS App` };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;

  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();

  if (!me) redirect('/sign-in');

  // Redirect to own profile if viewing self
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', me.id)
    .single();

  if (myProfile?.username === username) redirect('/profile');

  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  // Only fetch content if public or viewer follows
  const showContent = profile.is_public || profile.is_following;
  const [postedVideos, posts] = showContent
    ? await Promise.all([getPostedVideos(profile.id), getUserPosts(profile.id)])
    : [[], []];

  return (
    <PublicProfileClient
      profile={profile}
      postedVideos={postedVideos}
      posts={posts}
      viewerId={me.id}
    />
  );
}

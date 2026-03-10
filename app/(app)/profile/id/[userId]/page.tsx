import { redirect, notFound } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import {
  getPublicProfileById,
  getPostedVideos,
  getUserPosts,
} from '../../../../../lib/profile/actions';
import { PublicProfileClient } from '../../[username]/PublicProfileClient';

interface Props {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  return { title: `Profile · The JESUS App`, description: `User profile ${userId}` };
}

export default async function ProfileByIdPage({ params }: Props) {
  const { userId } = await params;

  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();

  if (!me) redirect('/sign-in');

  // Redirect to own profile if viewing self
  if (me.id === userId) redirect('/profile');

  const profile = await getPublicProfileById(userId);
  if (!profile) notFound();

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

import { redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { getSavedVerses, getPostedVideos } from '../../../../../lib/profile/actions';
import { SavedPageClient } from './SavedPageClient';

interface Props {
  params: Promise<{ username: string }>;
}

export const metadata = { title: 'Saved · The JESUS App' };

export default async function SavedPage({ params }: Props) {
  const { username } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: myRow } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (myRow?.username !== username) redirect(`/profile/${username}`);

  // Fetch saved verses + liked videos in parallel
  const [savedVerses, likedVideos] = await Promise.all([
    getSavedVerses(),
    // liked videos: join post_likes / likes to get videos the user liked
    (async () => {
      const { data: likes } = await supabase
        .from('likes')
        .select('video_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!likes?.length) return [];
      const videoIds = likes.map((l) => l.video_id as string);
      const { data: videos } = await supabase
        .from('videos')
        .select('id, url, caption, thumbnail_url, created_at')
        .in('id', videoIds);
      return (videos ?? []).map((v) => ({
        id: v.id as string,
        url: v.url as string,
        caption: v.caption as string | null,
        thumbnail_url: v.thumbnail_url as string | null,
        created_at: v.created_at as string,
      }));
    })(),
  ]);

  return (
    <SavedPageClient
      username={username}
      savedVerses={savedVerses}
      likedVideos={likedVideos}
    />
  );
}

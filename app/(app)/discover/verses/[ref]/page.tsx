import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '../../../../../lib/supabase/server';
import { getPostsByVerseTag, getVerseStats } from '../../../../../lib/discover/actions';
import { DAILY_VERSES } from '../../../../../lib/explore/daily-verses';
import { VerseTagClient } from '../../../../../libs/discover/VerseTagClient';

interface Props {
  params: Promise<{ ref: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ref } = await params;
  const verseRef = decodeURIComponent(ref);
  const daily = DAILY_VERSES.find((v) => v.reference === verseRef);
  const { post_count } = await getVerseStats(verseRef);

  const title = `${verseRef}: ${post_count} perspective${post_count !== 1 ? 's' : ''} · The JESUS App`;
  const description = daily?.text ?? `See what people are saying about ${verseRef}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function VerseTagPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { ref } = await params;
  const verseRef = decodeURIComponent(ref);

  const daily = DAILY_VERSES.find((v) => v.reference === verseRef);

  const [{ posts, nextCursor }, { post_count, save_count }] = await Promise.all([
    getPostsByVerseTag(verseRef),
    getVerseStats(verseRef),
  ]);

  return (
    <VerseTagClient
      verseRef={verseRef}
      verseText={daily?.text ?? null}
      initialPosts={posts}
      initialCursor={nextCursor}
      postCount={post_count}
      saveCount={save_count}
    />
  );
}

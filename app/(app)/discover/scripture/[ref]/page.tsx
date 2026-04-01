import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '../../../../../lib/supabase/server';
import { getPostsByVerseTag, getVerseStats } from '../../../../../lib/discover/actions';
import { DAILY_VERSES } from '../../../../../lib/explore/daily-verses';
import { ScriptureDetailClient } from '../../../../../libs/discover/ScriptureDetailClient';

interface Props {
  params: Promise<{ ref: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ref } = await params;
  const verseRef = decodeURIComponent(ref);
  const daily = DAILY_VERSES.find((v) => v.reference === verseRef);
  const { save_count } = await getVerseStats(verseRef);

  const title = `${verseRef} · The JESUS App`;
  const description = daily?.text
    ? `"${daily.text.slice(0, 120)}…"`
    : `Read and explore ${verseRef}. Saved ${save_count} time${save_count !== 1 ? 's' : ''}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  };
}

export default async function ScripturePage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { ref } = await params;
  const verseRef = decodeURIComponent(ref);

  const daily = DAILY_VERSES.find((v) => v.reference === verseRef);
  const { posts: initialTestimonies, nextCursor } = await getPostsByVerseTag(verseRef);

  return (
    <ScriptureDetailClient
      verseRef={verseRef}
      verseText={daily?.text ?? null}
      initialTestimonies={initialTestimonies}
      initialCursor={nextCursor}
    />
  );
}

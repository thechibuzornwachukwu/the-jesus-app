import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { getCourseProgress } from '../../../lib/learn/actions';
import { LearnClient } from './LearnClient';

export const metadata = { title: 'Learn  The JESUS App' };

type LearnPageProps = {
  searchParams?: Promise<{ berean?: string }>;
};

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const progress = await getCourseProgress();
  const params = searchParams ? await searchParams : undefined;
  const initialBereanOpen = params?.berean === '1';

  return <LearnClient initialProgress={progress} initialBereanOpen={initialBereanOpen} />;
}

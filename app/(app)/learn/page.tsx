import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { getCourseProgress } from '../../../lib/learn/actions';
import { LearnClient } from './LearnClient';

export const metadata = { title: 'Learn  The JESUS App' };

export default async function LearnPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const progress = await getCourseProgress();

  return <LearnClient initialProgress={progress} />;
}

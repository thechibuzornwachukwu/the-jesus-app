import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { getTrendingVerses, getSuggestedPeople } from '../../../lib/discover/actions';
import { DiscoverClient } from './DiscoverClient';

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const [trendingVerses, suggestedPeople] = await Promise.all([
    getTrendingVerses(12),
    getSuggestedPeople(user.id, 10),
  ]);

  return (
    <DiscoverClient
      trendingVerses={trendingVerses}
      suggestedPeople={suggestedPeople}
    />
  );
}

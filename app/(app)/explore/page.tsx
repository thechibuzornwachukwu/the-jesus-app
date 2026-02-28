import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { getUnifiedFeed } from '../../../lib/explore/actions';
import { getDailyVerse } from '../../../lib/explore/daily-verses';
import { ExploreClient } from './ExploreClient';

export const metadata = { title: 'Explore — The JESUS App' };

export default async function ExplorePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const [{ items, nextCursor }, dailyVerse] = await Promise.all([
    getUnifiedFeed(),
    Promise.resolve(getDailyVerse()),
  ]);

  return (
    <ExploreClient
      initialItems={items}
      initialCursor={nextCursor}
      dailyVerse={dailyVerse}
      userId={user.id}
    />
  );
}

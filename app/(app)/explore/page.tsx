import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { getUnifiedFeed } from '../../../lib/explore/actions';
import { ExploreClient } from './ExploreClient';

export const metadata = { title: 'Explore  The JESUS App' };

export default async function ExplorePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const { items, nextCursor } = await getUnifiedFeed();

  return (
    <ExploreClient
      initialItems={items}
      initialCursor={nextCursor}
      userId={user.id}
    />
  );
}

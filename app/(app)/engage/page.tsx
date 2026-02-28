import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { getCellsWithMemberPreviews, getMyCellsWithPreviews } from '../../../lib/cells/actions';
import { EngageClient } from './EngageClient';

export const metadata = { title: 'Engage — The JESUS App' };

export default async function EngagePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const [myCells, profileRes] = await Promise.all([
    getMyCellsWithPreviews(user.id),
    supabase.from('profiles').select('content_categories').eq('id', user.id).single(),
  ]);
  const joinedIds = myCells.map((c) => c.id);
  const discoverCells = await getCellsWithMemberPreviews(joinedIds);
  const userCategories =
    (profileRes.data as { content_categories?: string[] } | null)?.content_categories ?? [];

  return (
    <EngageClient
      myCells={myCells}
      discoverCells={discoverCells}
      currentUserId={user.id}
      userCategories={userCategories}
    />
  );
}

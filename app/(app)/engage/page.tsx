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

  const myCells = await getMyCellsWithPreviews(user.id);
  const joinedIds = myCells.map((c) => c.id);
  const discoverCells = await getCellsWithMemberPreviews(joinedIds);

  return (
    <EngageClient
      myCells={myCells}
      discoverCells={discoverCells}
      currentUserId={user.id}
    />
  );
}

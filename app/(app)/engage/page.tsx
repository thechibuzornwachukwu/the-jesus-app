import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { EngageClient } from './EngageClient';
import type { Cell } from '../../../lib/cells/types';

export const metadata = { title: 'Engage — The JESUS App' };

export default async function EngagePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  // Fetch cells the user is a member of
  const { data: memberships } = await supabase
    .from('cell_members')
    .select('cell_id, cells(*)')
    .eq('user_id', user.id);

  const myCells: Cell[] = (memberships ?? [])
    .map((m) => m.cells as unknown as Cell)
    .filter(Boolean);

  const joinedIds = myCells.map((c) => c.id);

  // Fetch public cells not already joined
  let discoverQuery = supabase
    .from('cells')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (joinedIds.length > 0) {
    discoverQuery = discoverQuery.not('id', 'in', `(${joinedIds.join(',')})`);
  }

  const { data: discoverCells } = await discoverQuery;

  return (
    <EngageClient
      myCells={myCells}
      discoverCells={(discoverCells as Cell[]) ?? []}
      currentUserId={user.id}
    />
  );
}

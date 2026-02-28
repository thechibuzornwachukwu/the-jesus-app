import { redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { CellInfoPage } from '../../../../../libs/cells/CellInfoPage';
import { getOrCreatePermanentInvite } from '../../../../../lib/cells/actions';
import type { CellMemberWithProfile } from '../../../../../lib/cells/types';

interface InfoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: InfoPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: cell } = await supabase.from('cells').select('name').eq('slug', slug).single();
  return { title: cell ? `${cell.name} — The JESUS App` : 'Cell — The JESUS App' };
}

export default async function CellInfoRoute({ params }: InfoPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  // Resolve cell by slug
  const { data: cell } = await supabase
    .from('cells')
    .select(
      'id, slug, name, description, category, avatar_url, banner_url, rules, member_limit, creator_id, is_public, created_at'
    )
    .eq('slug', slug)
    .single();

  if (!cell) redirect('/engage');

  const [{ count: memberCount }, membersResult, membershipResult] = await Promise.all([
    supabase
      .from('cell_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('cell_id', cell.id),
    supabase
      .from('cell_members')
      .select('cell_id, user_id, role, joined_at, profiles(id, username, avatar_url)')
      .eq('cell_id', cell.id)
      .order('role', { ascending: false })
      .order('joined_at', { ascending: true })
      .limit(11),
    supabase
      .from('cell_members')
      .select('role')
      .eq('cell_id', cell.id)
      .eq('user_id', user.id)
      .single(),
  ]);

  const isMember = !!membershipResult.data;
  const userRole = (membershipResult.data?.role as 'admin' | 'member' | null) ?? null;

  // Get or create the permanent invite link (auto-creates for admins; read-only for members)
  const permanentInviteCode = isMember ? await getOrCreatePermanentInvite(cell.id) : null;

  return (
    <CellInfoPage
      cell={cell as Parameters<typeof CellInfoPage>[0]['cell']}
      memberCount={memberCount ?? 0}
      membersPreview={(membersResult.data as unknown as CellMemberWithProfile[]) ?? []}
      isMember={isMember}
      userRole={userRole}
      permanentInviteCode={permanentInviteCode}
    />
  );
}

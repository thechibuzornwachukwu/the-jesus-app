import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { Chat } from '../../../../libs/cells/Chat';
import { getBlockedUsers } from '../../../../lib/profile/actions';
import type { Message, Profile } from '../../../../lib/cells/types';

interface CellPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CellPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: cell } = await supabase
    .from('cells')
    .select('name')
    .eq('slug', slug)
    .single();
  return { title: cell ? `${cell.name} — The JESUS App` : 'Cell — The JESUS App' };
}

export default async function CellPage({ params }: CellPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  // Resolve cell by slug
  const { data: cell } = await supabase
    .from('cells')
    .select('id, name, avatar_url')
    .eq('slug', slug)
    .single();

  if (!cell) redirect('/engage');

  // Verify membership
  const { data: membership } = await supabase
    .from('cell_members')
    .select('role')
    .eq('cell_id', cell.id)
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect(`/engage/${slug}/info`);

  // Fetch member count
  const { count: memberCount } = await supabase
    .from('cell_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('cell_id', cell.id);

  // Fetch current user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', user.id)
    .single();

  const currentUser: Profile = profile ?? {
    id: user.id,
    username: user.email?.split('@')[0] ?? 'You',
    avatar_url: null,
  };

  // Fetch last 50 messages and blocked users in parallel
  const [messagesResult, blockedUserIds] = await Promise.all([
    supabase
      .from('chat_messages')
      .select('*, profiles(username, avatar_url)')
      .eq('cell_id', cell.id)
      .order('created_at', { ascending: true })
      .limit(50),
    getBlockedUsers(),
  ]);

  return (
    <Chat
      cellId={cell.id}
      cellName={cell.name}
      cellAvatar={(cell as { avatar_url?: string | null }).avatar_url ?? null}
      memberCount={memberCount ?? undefined}
      currentUser={currentUser}
      initialMessages={(messagesResult.data as Message[]) ?? []}
      blockedUserIds={blockedUserIds}
      userRole={membership.role as 'admin' | 'member'}
    />
  );
}

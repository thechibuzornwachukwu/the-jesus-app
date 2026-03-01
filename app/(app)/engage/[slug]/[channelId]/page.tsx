import { redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { CellShell } from '../../../../../libs/cells/CellShell';
import { getBlockedUsers } from '../../../../../lib/profile/actions';
import { getChannelCategories, getUnreadCounts, getCellMembers, getStoriesForCells } from '../../../../../lib/cells/actions';
import type { Cell, Message, Profile } from '../../../../../lib/cells/types';

interface ChannelPageProps {
  params: Promise<{ slug: string; channelId: string }>;
}

export async function generateMetadata({ params }: ChannelPageProps) {
  const { slug, channelId } = await params;
  const supabase = await createClient();
  const [{ data: cell }, { data: channel }] = await Promise.all([
    supabase.from('cells').select('name').eq('slug', slug).single(),
    supabase.from('channels').select('name').eq('id', channelId).single(),
  ]);
  const title = cell && channel
    ? `#${channel.name}  ${cell.name}  The JESUS App`
    : 'Cell  The JESUS App';
  return { title };
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { slug, channelId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  // Resolve cell by slug
  const { data: cell } = await supabase
    .from('cells')
    .select('id, slug, name, description, category, avatar_url, banner_url, rules, member_limit, creator_id, is_public, created_at')
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

  // Verify channel belongs to cell
  const { data: channel } = await supabase
    .from('channels')
    .select('id, name, topic')
    .eq('id', channelId)
    .eq('cell_id', cell.id)
    .single();

  if (!channel) redirect(`/engage/${slug}`);

  // Current user profile
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

  // Parallel: messages for this channel, blocked users, categories, unread counts, members, stories
  const [messagesResult, blockedUserIds, categories, unreadCounts, members, storyGroups] = await Promise.all([
    supabase
      .from('chat_messages')
      .select('*, profiles(username, avatar_url)')
      .eq('cell_id', cell.id)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(50),
    getBlockedUsers(),
    getChannelCategories(cell.id),
    getUnreadCounts(cell.id),
    getCellMembers(cell.id),
    getStoriesForCells([cell.id], user.id).catch(() => []),
  ]);

  // Mark this channel as read
  await supabase.from('channel_read_states').upsert(
    { user_id: user.id, channel_id: channelId, last_read_at: new Date().toISOString() },
    { onConflict: 'user_id,channel_id' }
  );

  const clearedUnread = { ...unreadCounts, [channelId]: 0 };

  return (
    <CellShell
      cell={cell as unknown as Cell}
      categories={categories}
      activeChannelId={channelId}
      initialMessages={(messagesResult.data as Message[]) ?? []}
      currentUser={currentUser}
      userRole={membership.role as 'admin' | 'member'}
      members={members}
      unreadCounts={clearedUnread}
      blockedUserIds={blockedUserIds}
      storyGroups={storyGroups}
    />
  );
}

'use server';

import { createClient } from '../supabase/server';
import type { Channel, ChannelCategory, ChannelType } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cellId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('cell_members')
    .select('role')
    .eq('cell_id', cellId)
    .eq('user_id', userId)
    .single();
  return data?.role === 'admin';
}

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function getChannelsForCell(cellId: string): Promise<ChannelCategory[]> {
  const supabase = await createClient();

  const [catRes, chanRes] = await Promise.all([
    supabase
      .from('channel_categories')
      .select('id, cell_id, name, position')
      .eq('cell_id', cellId)
      .order('position', { ascending: true }),
    supabase
      .from('channels')
      .select('*')
      .eq('cell_id', cellId)
      .order('position', { ascending: true }),
  ]);

  const categories = (catRes.data ?? []) as ChannelCategory[];
  const channels = (chanRes.data ?? []) as Channel[];

  return categories.map((cat) => ({
    ...cat,
    channels: channels.filter((ch) => ch.category_id === cat.id),
  }));
}

export async function getUnreadCounts(
  cellId: string,
  userId: string
): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data: channels } = await supabase
    .from('channels')
    .select('id')
    .eq('cell_id', cellId);

  if (!channels || channels.length === 0) return {};

  const channelIds = (channels as { id: string }[]).map((c) => c.id);

  const { data: readStates } = await supabase
    .from('channel_read_state')
    .select('channel_id, last_read_at')
    .eq('user_id', userId)
    .in('channel_id', channelIds);

  const readMap = new Map<string, string>(
    ((readStates ?? []) as { channel_id: string; last_read_at: string }[]).map((rs) => [
      rs.channel_id,
      rs.last_read_at,
    ])
  );

  const counts: Record<string, number> = {};
  await Promise.all(
    channelIds.map(async (channelId) => {
      const lastRead = readMap.get(channelId);
      let query = supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('channel_id', channelId)
        .neq('user_id', userId);

      if (lastRead) query = query.gt('created_at', lastRead);

      const { count } = await query;
      counts[channelId] = count ?? 0;
    })
  );

  return counts;
}

// ─── Write: channels ──────────────────────────────────────────────────────────

export async function createChannel(
  cellId: string,
  data: {
    name: string;
    category_id?: string | null;
    emoji?: string | null;
    color?: string | null;
    channel_type?: ChannelType;
    topic?: string | null;
    is_read_only?: boolean;
    position?: number;
  }
): Promise<{ channel: Channel } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };
  if (!(await requireAdmin(supabase, cellId, user.id))) return { error: 'Not authorized.' };

  let position = data.position ?? 0;
  if (data.position == null) {
    const { data: last } = await supabase
      .from('channels')
      .select('position')
      .eq('cell_id', cellId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();
    position = last ? (last as { position: number }).position + 1 : 0;
  }

  const { data: channel, error } = await supabase
    .from('channels')
    .insert({
      cell_id: cellId,
      category_id: data.category_id ?? null,
      name: data.name.toLowerCase().replace(/\s+/g, '-'),
      emoji: data.emoji ?? null,
      color: data.color ?? null,
      channel_type: data.channel_type ?? 'text',
      position,
      topic: data.topic ?? null,
      is_read_only: data.is_read_only ?? false,
      created_by: user.id,
    })
    .select('*')
    .single();

  if (error || !channel) return { error: 'Failed to create channel.' };
  return { channel: channel as Channel };
}

export async function updateChannel(
  id: string,
  data: Partial<
    Pick<Channel, 'name' | 'emoji' | 'color' | 'topic' | 'is_read_only' | 'position' | 'category_id'>
  >
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: channel } = await supabase
    .from('channels')
    .select('cell_id')
    .eq('id', id)
    .single();
  if (!channel) return { error: 'Channel not found.' };

  if (!(await requireAdmin(supabase, (channel as { cell_id: string }).cell_id, user.id)))
    return { error: 'Not authorized.' };

  const update: Record<string, unknown> = { ...data };
  if (data.name) update.name = data.name.toLowerCase().replace(/\s+/g, '-');

  const { error } = await supabase.from('channels').update(update).eq('id', id);
  if (error) return { error: 'Failed to update channel.' };
  return { success: true };
}

export async function deleteChannel(id: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: channel } = await supabase
    .from('channels')
    .select('cell_id')
    .eq('id', id)
    .single();
  if (!channel) return { error: 'Channel not found.' };

  if (!(await requireAdmin(supabase, (channel as { cell_id: string }).cell_id, user.id)))
    return { error: 'Not authorized.' };

  const { error } = await supabase.from('channels').delete().eq('id', id);
  if (error) return { error: 'Failed to delete channel.' };
  return { success: true };
}

export async function reorderChannels(
  cellId: string,
  orderedIds: string[]
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };
  if (!(await requireAdmin(supabase, cellId, user.id))) return { error: 'Not authorized.' };

  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from('channels').update({ position: idx }).eq('id', id).eq('cell_id', cellId)
    )
  );
  return { success: true };
}

// ─── Write: categories ────────────────────────────────────────────────────────

export async function createCategory(
  cellId: string,
  name: string
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };
  if (!(await requireAdmin(supabase, cellId, user.id))) return { error: 'Not authorized.' };

  const { data: last } = await supabase
    .from('channel_categories')
    .select('position')
    .eq('cell_id', cellId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = last ? (last as { position: number }).position + 1 : 0;

  const { data, error } = await supabase
    .from('channel_categories')
    .insert({ cell_id: cellId, name, position })
    .select('id')
    .single();

  if (error || !data) return { error: 'Failed to create category.' };
  return { id: (data as { id: string }).id };
}

export async function reorderCategories(
  cellId: string,
  orderedIds: string[]
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };
  if (!(await requireAdmin(supabase, cellId, user.id))) return { error: 'Not authorized.' };

  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase
        .from('channel_categories')
        .update({ position: idx })
        .eq('id', id)
        .eq('cell_id', cellId)
    )
  );
  return { success: true };
}

// ─── Read state & notification scores ────────────────────────────────────────

export async function updateReadState(channelId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('channel_read_state').upsert(
    { user_id: user.id, channel_id: channelId, last_read_at: new Date().toISOString() },
    { onConflict: 'user_id,channel_id' }
  );
}

export async function addNotificationScore(channelId: string, delta: number): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from('channel_notification_scores')
    .select('score')
    .eq('user_id', user.id)
    .eq('channel_id', channelId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('channel_notification_scores')
      .update({ score: (existing as { score: number }).score + delta })
      .eq('user_id', user.id)
      .eq('channel_id', channelId);
  } else {
    await supabase
      .from('channel_notification_scores')
      .insert({ user_id: user.id, channel_id: channelId, score: Math.max(0, delta) });
  }
}

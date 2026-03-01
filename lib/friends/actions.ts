'use server';

import { createClient } from '../supabase/server';
import { z } from 'zod';

export type FriendshipStatus = 'pending' | 'accepted';

export type FriendWithProfile = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  profile: { id: string; username: string; avatar_url: string | null };
};

// ────────────────────────────────────────────────────────────
// getFriends — accepted friendships with profile join
// ────────────────────────────────────────────────────────────
export async function getFriends(userId?: string): Promise<FriendWithProfile[]> {
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  if (!me) return [];

  const targetId = userId ?? me.id;

  const { data, error } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status, created_at')
    .or(`requester_id.eq.${targetId},addressee_id.eq.${targetId}`)
    .eq('status', 'accepted');

  if (error || !data || data.length === 0) return [];

  type RawFriendship = {
    id: string;
    requester_id: string;
    addressee_id: string;
    status: string;
    created_at: string;
  };

  const rows = data as RawFriendship[];
  const otherIds = rows.map((r) =>
    r.requester_id === targetId ? r.addressee_id : r.requester_id
  );

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', otherIds);

  const profileMap = new Map<string, { id: string; username: string; avatar_url: string | null }>();
  (profiles ?? []).forEach((p) => profileMap.set(p.id, p));

  return rows.map((r) => {
    const otherId = r.requester_id === targetId ? r.addressee_id : r.requester_id;
    return {
      ...r,
      status: r.status as FriendshipStatus,
      profile: profileMap.get(otherId) ?? { id: otherId, username: 'Unknown', avatar_url: null },
    };
  });
}

// ────────────────────────────────────────────────────────────
// getFriendCount
// ────────────────────────────────────────────────────────────
export async function getFriendCount(userId?: string): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  if (!me) return 0;

  const targetId = userId ?? me.id;

  const { count } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .or(`requester_id.eq.${targetId},addressee_id.eq.${targetId}`)
    .eq('status', 'accepted');

  return count ?? 0;
}

// ────────────────────────────────────────────────────────────
// getPendingRequests — incoming pending requests for current user
// ────────────────────────────────────────────────────────────
export async function getPendingRequests(): Promise<FriendWithProfile[]> {
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  if (!me) return [];

  const { data, error } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status, created_at')
    .eq('addressee_id', me.id)
    .eq('status', 'pending');

  if (error || !data || data.length === 0) return [];

  type RawFriendship = {
    id: string;
    requester_id: string;
    addressee_id: string;
    status: string;
    created_at: string;
  };

  const rows = data as RawFriendship[];
  const requesterIds = rows.map((r) => r.requester_id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', requesterIds);

  const profileMap = new Map<string, { id: string; username: string; avatar_url: string | null }>();
  (profiles ?? []).forEach((p) => profileMap.set(p.id, p));

  return rows.map((r) => ({
    ...r,
    status: r.status as FriendshipStatus,
    profile: profileMap.get(r.requester_id) ?? {
      id: r.requester_id,
      username: 'Unknown',
      avatar_url: null,
    },
  }));
}

// ────────────────────────────────────────────────────────────
// sendFriendRequest
// ────────────────────────────────────────────────────────────
export async function sendFriendRequest(
  targetId: string
): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(targetId);
  if (!parsed.success) return { error: 'Invalid user ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };
  if (user.id === targetId) return { error: 'Cannot friend yourself' };

  // Check if a friendship already exists in either direction
  const { data: existing } = await supabase
    .from('friendships')
    .select('id')
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${user.id})`
    )
    .maybeSingle();

  if (existing) return { error: 'Request already exists' };

  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: user.id, addressee_id: targetId, status: 'pending' });

  return error ? { error: error.message } : {};
}

// ────────────────────────────────────────────────────────────
// acceptFriendRequest
// ────────────────────────────────────────────────────────────
export async function acceptFriendRequest(
  requesterId: string
): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(requesterId);
  if (!parsed.success) return { error: 'Invalid user ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };

  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('requester_id', requesterId)
    .eq('addressee_id', user.id)
    .eq('status', 'pending');

  return error ? { error: error.message } : {};
}

// ────────────────────────────────────────────────────────────
// removeFriend — removes friendship in either direction
// ────────────────────────────────────────────────────────────
export async function removeFriend(
  targetId: string
): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(targetId);
  if (!parsed.success) return { error: 'Invalid user ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };

  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${user.id})`
    );

  return error ? { error: error.message } : {};
}

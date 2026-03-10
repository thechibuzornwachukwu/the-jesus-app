'use server';

import { createClient } from '../supabase/server';
import { z } from 'zod';
import { sendPushToUser } from '../notifications/push';

export type FollowStatus = 'following' | 'not_following';

export type ProfileSummary = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export type FollowCounts = {
  followers: number;
  following: number;
};

// ────────────────────────────────────────────────────────────
// followUser
// ────────────────────────────────────────────────────────────
export async function followUser(targetId: string): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(targetId);
  if (!parsed.success) return { error: 'Invalid user ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };
  if (user.id === targetId) return { error: 'Cannot follow yourself' };

  // Respect blocked_users — abort if either side has blocked the other
  const { data: blocked } = await supabase
    .from('blocked_users')
    .select('blocker_id')
    .or(
      `and(blocker_id.eq.${user.id},blocked_id.eq.${targetId}),` +
      `and(blocker_id.eq.${targetId},blocked_id.eq.${user.id})`
    )
    .maybeSingle();

  if (blocked) return { error: 'Action not permitted' };

  // Respect is_public — private profiles cannot be followed silently;
  // the caller should show a "Request to follow" flow instead.
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('is_public, username')
    .eq('id', targetId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!targetProfile) return { error: 'User not found' };

  // Insert the follow row (DB trigger handles notification insert + count update)
  const { error } = await supabase
    .from('user_follows')
    .insert({ follower_id: user.id, following_id: targetId });

  if (error) {
    // Unique-violation means already following — treat as no-op
    if (error.code === '23505') return {};
    return { error: error.message };
  }

  // Fire-and-forget push notification to the followed user
  const { data: me } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle();

  sendPushToUser(
    targetId,
    'New follower',
    `${me?.username ?? 'Someone'} started following you`,
    '/profile'
  );

  return {};
}

// ────────────────────────────────────────────────────────────
// unfollowUser
// ────────────────────────────────────────────────────────────
export async function unfollowUser(targetId: string): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(targetId);
  if (!parsed.success) return { error: 'Invalid user ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };

  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetId);

  return error ? { error: error.message } : {};
}

// ────────────────────────────────────────────────────────────
// getFollowStatus
// ────────────────────────────────────────────────────────────
export async function getFollowStatus(targetId: string): Promise<FollowStatus> {
  const parsed = z.string().uuid().safeParse(targetId);
  if (!parsed.success) return 'not_following';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 'not_following';

  const { data } = await supabase
    .from('user_follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', targetId)
    .maybeSingle();

  return data ? 'following' : 'not_following';
}

// ────────────────────────────────────────────────────────────
// getFollowers  — users who follow `userId`
// ────────────────────────────────────────────────────────────
export async function getFollowers(userId?: string): Promise<ProfileSummary[]> {
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  if (!me) return [];

  const targetId = userId ?? me.id;

  const { data } = await supabase
    .from('user_follows')
    .select('follower_id')
    .eq('following_id', targetId);

  if (!data || data.length === 0) return [];

  const ids = data.map((r) => r.follower_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', ids)
    .is('deleted_at', null);

  return (profiles ?? []) as ProfileSummary[];
}

// ────────────────────────────────────────────────────────────
// getFollowing  — users that `userId` follows
// ────────────────────────────────────────────────────────────
export async function getFollowing(userId?: string): Promise<ProfileSummary[]> {
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  if (!me) return [];

  const targetId = userId ?? me.id;

  const { data } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', targetId);

  if (!data || data.length === 0) return [];

  const ids = data.map((r) => r.following_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', ids)
    .is('deleted_at', null);

  return (profiles ?? []) as ProfileSummary[];
}

// ────────────────────────────────────────────────────────────
// getFollowCounts  — reads pre-computed columns from profiles
// ────────────────────────────────────────────────────────────
export async function getFollowCounts(userId?: string): Promise<FollowCounts> {
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  if (!me) return { followers: 0, following: 0 };

  const targetId = userId ?? me.id;

  const { data } = await supabase
    .from('profiles')
    .select('follower_count, following_count')
    .eq('id', targetId)
    .maybeSingle();

  return {
    followers: data?.follower_count ?? 0,
    following: data?.following_count ?? 0,
  };
}

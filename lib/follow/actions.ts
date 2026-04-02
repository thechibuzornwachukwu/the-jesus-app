'use server';

import { createClient } from '../supabase/server';

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

export async function followUser(targetId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  if (user.id === targetId) return { error: 'Cannot follow yourself' };

  const { error } = await supabase
    .from('user_follows')
    .insert({ follower_id: user.id, following_id: targetId });

  if (error && error.code !== '23505') return { error: error.message };
  return {};
}

export async function unfollowUser(targetId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetId);

  if (error) return { error: error.message };
  return {};
}

export async function getFollowStatus(targetId: string): Promise<FollowStatus> {
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

export async function getFollowers(userId?: string): Promise<ProfileSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const targetId = userId ?? user.id;

  const { data: follows } = await supabase
    .from('user_follows')
    .select('follower_id')
    .eq('following_id', targetId);

  if (!follows?.length) return [];
  const ids = follows.map((f) => f.follower_id as string);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', ids);

  return (profiles ?? []).map((p) => ({
    id: p.id as string,
    username: p.username as string,
    avatar_url: p.avatar_url as string | null,
  }));
}

export async function getFollowing(userId?: string): Promise<ProfileSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const targetId = userId ?? user.id;

  const { data: follows } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', targetId);

  if (!follows?.length) return [];
  const ids = follows.map((f) => f.following_id as string);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', ids);

  return (profiles ?? []).map((p) => ({
    id: p.id as string,
    username: p.username as string,
    avatar_url: p.avatar_url as string | null,
  }));
}

export async function getFollowCounts(userId?: string): Promise<FollowCounts> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { followers: 0, following: 0 };

  const targetId = userId ?? user.id;

  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase
      .from('user_follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('following_id', targetId),
    supabase
      .from('user_follows')
      .select('following_id', { count: 'exact', head: true })
      .eq('follower_id', targetId),
  ]);

  return { followers: followers ?? 0, following: following ?? 0 };
}

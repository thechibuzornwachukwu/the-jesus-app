'use server';

// Stubs — Follow is wired in Phase 8

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

export async function followUser(_targetId: string): Promise<{ error?: string }> {
  return {};
}

export async function unfollowUser(_targetId: string): Promise<{ error?: string }> {
  return {};
}

export async function getFollowStatus(_targetId: string): Promise<FollowStatus> {
  return 'not_following';
}

export async function getFollowers(_userId?: string): Promise<ProfileSummary[]> {
  return [];
}

export async function getFollowing(_userId?: string): Promise<ProfileSummary[]> {
  return [];
}

export async function getFollowCounts(_userId?: string): Promise<FollowCounts> {
  return { followers: 0, following: 0 };
}

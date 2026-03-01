'use server';

import { createClient } from '../supabase/server';
import { z } from 'zod';

export type Story = {
  id: string;
  cell_id: string;
  author_id: string;
  media_url: string;
  caption: string | null;
  expires_at: string;
  created_at: string;
  author: { username: string; avatar_url: string | null } | null;
};

// ────────────────────────────────────────────────────────────
// getCellStories  active (non-expired) stories for a cell
// ────────────────────────────────────────────────────────────
export async function getCellStories(cellId: string): Promise<Story[]> {
  const parsed = z.string().uuid().safeParse(cellId);
  if (!parsed.success) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('stories')
    .select('id, cell_id, author_id, media_url, caption, expires_at, created_at')
    .eq('cell_id', cellId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true });

  if (error || !data || data.length === 0) return [];

  type RawStory = {
    id: string;
    cell_id: string;
    author_id: string;
    media_url: string;
    caption: string | null;
    expires_at: string;
    created_at: string;
  };

  const rows = data as RawStory[];
  const authorIds = [...new Set(rows.map((s) => s.author_id))];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', authorIds);

  const profileMap = new Map<string, { username: string; avatar_url: string | null }>();
  (profiles ?? []).forEach((p) => profileMap.set(p.id, { username: p.username, avatar_url: p.avatar_url }));

  return rows.map((s) => ({
    ...s,
    author: profileMap.get(s.author_id) ?? null,
  }));
}

// ────────────────────────────────────────────────────────────
// createStory  admin-only: insert a story for a cell
// ────────────────────────────────────────────────────────────
const createStorySchema = z.object({
  cellId: z.string().uuid(),
  mediaUrl: z.string().url(),
  caption: z.string().max(300).trim().optional(),
});

export async function createStory(
  cellId: string,
  mediaUrl: string,
  caption?: string
): Promise<{ storyId?: string; error?: string }> {
  const parsed = createStorySchema.safeParse({ cellId, mediaUrl, caption });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };

  // Verify admin membership
  const { data: membership } = await supabase
    .from('cell_members')
    .select('role')
    .eq('cell_id', parsed.data.cellId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership || membership.role !== 'admin') {
    return { error: 'Only cell admins can post stories' };
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('stories')
    .insert({
      cell_id: parsed.data.cellId,
      author_id: user.id,
      media_url: parsed.data.mediaUrl,
      caption: parsed.data.caption ?? null,
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (error || !data) return { error: error?.message ?? 'Failed to create story' };
  return { storyId: data.id };
}

// ────────────────────────────────────────────────────────────
// deleteStory  author or admin can delete
// ────────────────────────────────────────────────────────────
export async function deleteStory(storyId: string): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(storyId);
  if (!parsed.success) return { error: 'Invalid story ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };

  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', storyId)
    .eq('author_id', user.id);

  return error ? { error: error.message } : {};
}

// ────────────────────────────────────────────────────────────
// deleteExpiredStories  called by cron / admin route
// ────────────────────────────────────────────────────────────
export async function deleteExpiredStories(): Promise<{ deleted: number; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('stories')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) return { deleted: 0, error: error.message };
  return { deleted: (data ?? []).length };
}

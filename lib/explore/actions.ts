'use server';

import { createClient } from '../supabase/server';
import { z } from 'zod';
import type { Video, Comment } from './types';

const PAGE_SIZE = 5;

// ---------------------------------------------------------------------------
// getVideos — paginated feed fetch
// ---------------------------------------------------------------------------
export async function getVideos(cursor?: string): Promise<{
  videos: Video[];
  nextCursor: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  type RawVideo = {
    id: string;
    user_id: string;
    url: string;
    thumbnail_url: string | null;
    caption: string | null;
    duration_sec: number | null;
    like_count: number;
    created_at: string;
    profiles: { username: string; avatar_url: string | null } | null;
    video_verses: { verse_reference: string; verse_text: string; position_pct: number }[];
  };

  let query = supabase
    .from('videos')
    .select(
      'id, user_id, url, thumbnail_url, caption, duration_sec, like_count, created_at, profiles(username, avatar_url), video_verses(verse_reference, verse_text, position_pct)'
    )
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: rows, error } = await query;
  if (error || !rows) return { videos: [], nextCursor: null };

  const hasMore = rows.length > PAGE_SIZE;
  const batch = (hasMore ? rows.slice(0, PAGE_SIZE) : rows) as unknown as RawVideo[];
  const videoIds = batch.map((v) => v.id);

  // Comment counts (public read)
  const commentCountMap = new Map<string, number>();
  if (videoIds.length > 0) {
    const { data: commentRows } = await supabase
      .from('comments')
      .select('video_id')
      .in('video_id', videoIds);
    (commentRows ?? []).forEach((c) => {
      commentCountMap.set(c.video_id, (commentCountMap.get(c.video_id) ?? 0) + 1);
    });
  }

  // User's own likes (RLS: select own — returns only rows where user_id = auth.uid())
  const userLikedSet = new Set<string>();
  if (user && videoIds.length > 0) {
    const { data: likeRows } = await supabase
      .from('likes')
      .select('video_id')
      .in('video_id', videoIds);
    (likeRows ?? []).forEach((l) => userLikedSet.add(l.video_id));
  }

  const videos: Video[] = batch.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    url: row.url,
    thumbnail_url: row.thumbnail_url,
    caption: row.caption,
    duration_sec: row.duration_sec,
    created_at: row.created_at,
    like_count: row.like_count ?? 0,
    comment_count: commentCountMap.get(row.id) ?? 0,
    user_liked: userLikedSet.has(row.id),
    verse: row.video_verses?.[0] ?? null,
    profiles: row.profiles ?? null,
  }));

  const nextCursor = hasMore ? batch[batch.length - 1].created_at : null;
  return { videos, nextCursor };
}

// ---------------------------------------------------------------------------
// toggleLike — like/unlike a video; like_count maintained by DB trigger
// ---------------------------------------------------------------------------
export async function toggleLike(
  videoId: string
): Promise<{ liked: boolean; likeCount: number; error?: string }> {
  const parsed = z.string().uuid().safeParse(videoId);
  if (!parsed.success) return { liked: false, likeCount: 0, error: 'Invalid video ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { liked: false, likeCount: 0, error: 'Unauthenticated' };

  // Check existing like (RLS: select own)
  const { data: existing } = await supabase
    .from('likes')
    .select('video_id')
    .eq('video_id', videoId)
    .maybeSingle();

  if (existing) {
    await supabase.from('likes').delete().eq('video_id', videoId);
  } else {
    await supabase.from('likes').insert({ user_id: user.id, video_id: videoId });
  }

  // Fetch updated count (trigger has already run)
  const { data: vid } = await supabase
    .from('videos')
    .select('like_count')
    .eq('id', videoId)
    .single();

  return { liked: !existing, likeCount: vid?.like_count ?? 0 };
}

// ---------------------------------------------------------------------------
// getComments — fetch comments for a video
// ---------------------------------------------------------------------------
export async function getComments(videoId: string): Promise<Comment[]> {
  const parsed = z.string().uuid().safeParse(videoId);
  if (!parsed.success) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('comments')
    .select('*, profiles(username, avatar_url)')
    .eq('video_id', videoId)
    .order('created_at', { ascending: true })
    .limit(50);

  return (data ?? []) as Comment[];
}

// ---------------------------------------------------------------------------
// addComment — add a comment to a video
// ---------------------------------------------------------------------------
const commentSchema = z.object({
  videoId: z.string().uuid(),
  content: z.string().min(1).max(500).trim(),
});

export async function addComment(
  videoId: string,
  content: string
): Promise<{ comment?: Comment; error?: string }> {
  const parsed = commentSchema.safeParse({ videoId, content });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };

  const { data, error } = await supabase
    .from('comments')
    .insert({ video_id: parsed.data.videoId, user_id: user.id, content: parsed.data.content })
    .select('*, profiles(username, avatar_url)')
    .single();

  if (error) return { error: error.message };
  return { comment: data as Comment };
}

// ---------------------------------------------------------------------------
// saveVerse — save a verse to the user's collection
// ---------------------------------------------------------------------------
const saveVerseSchema = z.object({
  verseReference: z.string().min(1).max(100),
  verseText: z.string().min(1).max(2000),
});

export async function saveVerse(
  verseReference: string,
  verseText: string
): Promise<{ error?: string }> {
  const parsed = saveVerseSchema.safeParse({ verseReference, verseText });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };

  const { error } = await supabase.from('saved_verses').upsert({
    user_id: user.id,
    verse_reference: parsed.data.verseReference,
    verse_text: parsed.data.verseText,
  });

  return error ? { error: error.message } : {};
}

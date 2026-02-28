'use server';

import { createClient } from '../supabase/server';
import { z } from 'zod';
import type { Video, Comment, Post, FeedItem } from './types';

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

  // Parallel: comment counts + user likes
  const [commentCountMap, userLikedSet] = await Promise.all([
    videoIds.length > 0
      ? supabase.from('comments').select('video_id').in('video_id', videoIds).then(({ data }) => {
          const m = new Map<string, number>();
          (data ?? []).forEach((c) => m.set(c.video_id, (m.get(c.video_id) ?? 0) + 1));
          return m;
        })
      : Promise.resolve(new Map<string, number>()),
    user && videoIds.length > 0
      ? supabase.from('likes').select('video_id').in('video_id', videoIds).then(({ data }) => {
          const s = new Set<string>();
          (data ?? []).forEach((l) => s.add(l.video_id));
          return s;
        })
      : Promise.resolve(new Set<string>()),
  ]);

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
// getVideoById — fetch a single video by ID (same shape as getVideos rows)
// ---------------------------------------------------------------------------
export async function getVideoById(videoId: string): Promise<Video | null> {
  const parsed = z.string().uuid().safeParse(videoId);
  if (!parsed.success) return null;

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

  const { data: row, error } = await supabase
    .from('videos')
    .select(
      'id, user_id, url, thumbnail_url, caption, duration_sec, like_count, created_at, profiles(username, avatar_url), video_verses(verse_reference, verse_text, position_pct)'
    )
    .eq('id', videoId)
    .single();

  if (error || !row) return null;
  const r = row as unknown as RawVideo;

  const { data: commentRows } = await supabase
    .from('comments')
    .select('video_id')
    .eq('video_id', videoId);
  const comment_count = (commentRows ?? []).length;

  let user_liked = false;
  if (user) {
    const { data: likeRow } = await supabase
      .from('likes')
      .select('video_id')
      .eq('video_id', videoId)
      .maybeSingle();
    user_liked = !!likeRow;
  }

  return {
    id: r.id,
    user_id: r.user_id,
    url: r.url,
    thumbnail_url: r.thumbnail_url,
    caption: r.caption,
    duration_sec: r.duration_sec,
    created_at: r.created_at,
    like_count: r.like_count ?? 0,
    comment_count,
    user_liked,
    verse: r.video_verses?.[0] ?? null,
    profiles: r.profiles ?? null,
  };
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

// ---------------------------------------------------------------------------
// createPost — create a text post
// ---------------------------------------------------------------------------
const createPostSchema = z.object({
  content: z.string().min(1).max(1000).trim(),
  verseReference: z.string().max(100).trim().optional(),
  verseText: z.string().max(2000).trim().optional(),
});

export async function createPost(
  content: string,
  verseReference?: string,
  verseText?: string
): Promise<{ postId: string } | { error: string }> {
  const parsed = createPostSchema.safeParse({ content, verseReference, verseText });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      content: parsed.data.content,
      verse_reference: parsed.data.verseReference || null,
      verse_text: parsed.data.verseText || null,
    })
    .select('id')
    .single();

  if (error || !data) return { error: error?.message ?? 'Failed to create post' };
  return { postId: data.id };
}

// ---------------------------------------------------------------------------
// togglePostLike — like/unlike a post; like_count maintained by DB trigger
// ---------------------------------------------------------------------------
export async function togglePostLike(
  postId: string
): Promise<{ liked: boolean; likeCount: number; error?: string }> {
  const parsed = z.string().uuid().safeParse(postId);
  if (!parsed.success) return { liked: false, likeCount: 0, error: 'Invalid post ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { liked: false, likeCount: 0, error: 'Unauthenticated' };

  const { data: existing } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .maybeSingle();

  if (existing) {
    await supabase.from('post_likes').delete().eq('post_id', postId);
  } else {
    await supabase.from('post_likes').insert({ user_id: user.id, post_id: postId });
  }

  const { data: post } = await supabase
    .from('posts')
    .select('like_count')
    .eq('id', postId)
    .single();

  return { liked: !existing, likeCount: post?.like_count ?? 0 };
}

// ---------------------------------------------------------------------------
// getPostById — fetch a single post by ID
// ---------------------------------------------------------------------------
export async function getPostById(postId: string): Promise<Post | null> {
  const parsed = z.string().uuid().safeParse(postId);
  if (!parsed.success) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  type RawPost = {
    id: string; user_id: string; content: string; image_url: string | null;
    verse_reference: string | null; verse_text: string | null;
    like_count: number; created_at: string;
    profiles: { username: string; avatar_url: string | null } | null;
  };

  const { data: row, error } = await supabase
    .from('posts')
    .select('id, user_id, content, image_url, verse_reference, verse_text, like_count, created_at, profiles(username, avatar_url)')
    .eq('id', postId)
    .single();

  if (error || !row) return null;
  const r = row as unknown as RawPost;

  const { data: commentRows } = await supabase
    .from('post_comments')
    .select('post_id')
    .eq('post_id', postId);
  const comment_count = (commentRows ?? []).length;

  let user_liked = false;
  if (user) {
    const { data: likeRow } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('post_id', postId)
      .maybeSingle();
    user_liked = !!likeRow;
  }

  return {
    id: r.id, user_id: r.user_id, content: r.content,
    image_url: r.image_url, verse_reference: r.verse_reference,
    verse_text: r.verse_text, like_count: r.like_count ?? 0,
    comment_count, user_liked, created_at: r.created_at, profiles: r.profiles ?? null,
  };
}

// ---------------------------------------------------------------------------
// getUnifiedFeed — merged video + post feed sorted by created_at DESC
// ---------------------------------------------------------------------------
const FEED_BATCH = 6;

export async function getUnifiedFeed(cursor?: string): Promise<{
  items: FeedItem[];
  nextCursor: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  type RawVideo = {
    id: string; user_id: string; url: string; thumbnail_url: string | null;
    caption: string | null; duration_sec: number | null; like_count: number;
    created_at: string;
    profiles: { username: string; avatar_url: string | null } | null;
    video_verses: { verse_reference: string; verse_text: string; position_pct: number }[];
  };

  type RawPost = {
    id: string; user_id: string; content: string; image_url: string | null;
    verse_reference: string | null; verse_text: string | null;
    like_count: number; created_at: string;
    profiles: { username: string; avatar_url: string | null } | null;
  };

  let videoQuery = supabase
    .from('videos')
    .select('id, user_id, url, thumbnail_url, caption, duration_sec, like_count, created_at, profiles(username, avatar_url), video_verses(verse_reference, verse_text, position_pct)')
    .order('created_at', { ascending: false })
    .limit(FEED_BATCH);

  let postQuery = supabase
    .from('posts')
    .select('id, user_id, content, image_url, verse_reference, verse_text, like_count, created_at, profiles(username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(FEED_BATCH);

  if (cursor) {
    videoQuery = videoQuery.lt('created_at', cursor);
    postQuery = postQuery.lt('created_at', cursor);
  }

  const [{ data: videoRows }, { data: postRows }] = await Promise.all([videoQuery, postQuery]);

  const videos = (videoRows ?? []) as unknown as RawVideo[];
  const posts = (postRows ?? []) as unknown as RawPost[];

  // Fetch comment counts
  const videoIds = videos.map((v) => v.id);
  const postIds = posts.map((p) => p.id);

  const [commentMapVideo, commentMapPost, userLikedVideos, userLikedPosts] = await Promise.all([
    videoIds.length > 0
      ? supabase.from('comments').select('video_id').in('video_id', videoIds).then(({ data }) => {
          const m = new Map<string, number>();
          (data ?? []).forEach((c) => m.set(c.video_id, (m.get(c.video_id) ?? 0) + 1));
          return m;
        })
      : Promise.resolve(new Map<string, number>()),
    postIds.length > 0
      ? supabase.from('post_comments').select('post_id').in('post_id', postIds).then(({ data }) => {
          const m = new Map<string, number>();
          (data ?? []).forEach((c) => m.set(c.post_id, (m.get(c.post_id) ?? 0) + 1));
          return m;
        })
      : Promise.resolve(new Map<string, number>()),
    user && videoIds.length > 0
      ? supabase.from('likes').select('video_id').in('video_id', videoIds).then(({ data }) => {
          const s = new Set<string>();
          (data ?? []).forEach((l) => s.add(l.video_id));
          return s;
        })
      : Promise.resolve(new Set<string>()),
    user && postIds.length > 0
      ? supabase.from('post_likes').select('post_id').in('post_id', postIds).then(({ data }) => {
          const s = new Set<string>();
          (data ?? []).forEach((l) => s.add(l.post_id));
          return s;
        })
      : Promise.resolve(new Set<string>()),
  ]);

  const videoItems: FeedItem[] = videos.map((v) => ({
    kind: 'video' as const,
    data: {
      id: v.id, user_id: v.user_id, url: v.url, thumbnail_url: v.thumbnail_url,
      caption: v.caption, duration_sec: v.duration_sec, created_at: v.created_at,
      like_count: v.like_count ?? 0,
      comment_count: commentMapVideo.get(v.id) ?? 0,
      user_liked: userLikedVideos.has(v.id),
      verse: v.video_verses?.[0] ?? null,
      profiles: v.profiles ?? null,
    },
  }));

  const postItems: FeedItem[] = posts.map((p) => ({
    kind: 'post' as const,
    data: {
      id: p.id, user_id: p.user_id, content: p.content, image_url: p.image_url,
      verse_reference: p.verse_reference, verse_text: p.verse_text,
      like_count: p.like_count ?? 0,
      comment_count: commentMapPost.get(p.id) ?? 0,
      user_liked: userLikedPosts.has(p.id),
      created_at: p.created_at, profiles: p.profiles ?? null,
    },
  }));

  // Merge and sort by created_at DESC, take first 5
  const merged = [...videoItems, ...postItems].sort(
    (a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
  );

  const PAGE = 5;
  const page = merged.slice(0, PAGE);
  const nextCursor = merged.length > PAGE ? page[page.length - 1].data.created_at : null;

  return { items: page, nextCursor };
}

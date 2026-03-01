'use server';

import { createClient } from '../supabase/server';
import { z } from 'zod';
import type { Video, Comment, Post, ImagePost, FeedItem, ReactionType } from './types';
import { logStreakEvent } from '../streaks/actions';

const PAGE_SIZE = 5;

// ---------------------------------------------------------------------------
// Helper: batch-fetch profiles by user IDs (avoids PostgREST FK-join)
// ---------------------------------------------------------------------------
async function fetchProfiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userIds: string[]
): Promise<Map<string, { username: string; avatar_url: string | null }>> {
  if (userIds.length === 0) return new Map();
  const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds);
  const map = new Map<string, { username: string; avatar_url: string | null }>();
  (data ?? []).forEach((p: { id: string; username: string; avatar_url: string | null }) => {
    map.set(p.id, { username: p.username, avatar_url: p.avatar_url });
  });
  return map;
}

// ---------------------------------------------------------------------------
// getVideos  paginated feed fetch
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
    video_verses: { verse_reference: string; verse_text: string; position_pct: number }[];
  };

  let query = supabase
    .from('videos')
    .select(
      'id, user_id, url, thumbnail_url, caption, duration_sec, like_count, created_at, video_verses(verse_reference, verse_text, position_pct)'
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
  const userIds = [...new Set(batch.map((v) => v.user_id))];

  const REACTION_TYPES: ReactionType[] = ['heart', 'amen', 'laugh', 'shock'];

  // Parallel: comment counts + user likes + reactions + profiles
  const [commentCountMap, userLikedSet, reactionRows, profileMap] = await Promise.all([
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
    videoIds.length > 0
      ? supabase
          .from('video_reactions')
          .select('video_id, user_id, reaction_type')
          .in('video_id', videoIds)
          .then(({ data }) => data ?? [])
      : Promise.resolve([] as { video_id: string; user_id: string; reaction_type: string }[]),
    fetchProfiles(supabase, userIds),
  ]);

  // Build per-video reaction counts + user's own reaction
  const reactionCountMap = new Map<string, Record<ReactionType, number>>();
  const userReactionMap = new Map<string, ReactionType>();
  for (const r of reactionRows as { video_id: string; user_id: string; reaction_type: string }[]) {
    if (!reactionCountMap.has(r.video_id)) {
      reactionCountMap.set(r.video_id, { heart: 0, amen: 0, laugh: 0, shock: 0 });
    }
    const counts = reactionCountMap.get(r.video_id)!;
    if (REACTION_TYPES.includes(r.reaction_type as ReactionType)) {
      counts[r.reaction_type as ReactionType]++;
    }
    if (user && r.user_id === user.id) {
      userReactionMap.set(r.video_id, r.reaction_type as ReactionType);
    }
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
    user_reaction: userReactionMap.get(row.id) ?? null,
    reaction_counts: reactionCountMap.get(row.id) ?? { heart: 0, amen: 0, laugh: 0, shock: 0 },
    verse: row.video_verses?.[0] ?? null,
    profiles: profileMap.get(row.user_id) ?? null,
  }));

  const nextCursor = hasMore ? batch[batch.length - 1].created_at : null;
  return { videos, nextCursor };
}

// ---------------------------------------------------------------------------
// getVideoById  fetch a single video by ID (same shape as getVideos rows)
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
    video_verses: { verse_reference: string; verse_text: string; position_pct: number }[];
  };

  const { data: row, error } = await supabase
    .from('videos')
    .select(
      'id, user_id, url, thumbnail_url, caption, duration_sec, like_count, created_at, video_verses(verse_reference, verse_text, position_pct)'
    )
    .eq('id', videoId)
    .single();

  if (error || !row) return null;
  const r = row as unknown as RawVideo;

  const [{ data: commentRows }, { data: reactionRows }, profileMap] = await Promise.all([
    supabase.from('comments').select('video_id').eq('video_id', videoId),
    supabase.from('video_reactions').select('user_id, reaction_type').eq('video_id', videoId),
    fetchProfiles(supabase, [r.user_id]),
  ]);
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

  const REACTION_TYPES: ReactionType[] = ['heart', 'amen', 'laugh', 'shock'];
  const reaction_counts: Record<ReactionType, number> = { heart: 0, amen: 0, laugh: 0, shock: 0 };
  let user_reaction: ReactionType | null = null;
  for (const rx of (reactionRows ?? []) as { user_id: string; reaction_type: string }[]) {
    if (REACTION_TYPES.includes(rx.reaction_type as ReactionType)) {
      reaction_counts[rx.reaction_type as ReactionType]++;
    }
    if (user && rx.user_id === user.id) {
      user_reaction = rx.reaction_type as ReactionType;
    }
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
    user_reaction,
    reaction_counts,
    verse: r.video_verses?.[0] ?? null,
    profiles: profileMap.get(r.user_id) ?? null,
  };
}

// ---------------------------------------------------------------------------
// toggleLike  like/unlike a video; like_count maintained by DB trigger
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
// toggleReaction  set / change / remove a reaction on a video
// ---------------------------------------------------------------------------
const VALID_REACTIONS: ReactionType[] = ['heart', 'amen', 'laugh', 'shock'];

export async function toggleReaction(
  videoId: string,
  reactionType: ReactionType
): Promise<{
  userReaction: ReactionType | null;
  counts: Record<ReactionType, number>;
  error?: string;
}> {
  const empty: Record<ReactionType, number> = { heart: 0, amen: 0, laugh: 0, shock: 0 };

  if (!z.string().uuid().safeParse(videoId).success) {
    return { userReaction: null, counts: empty, error: 'Invalid video ID' };
  }
  if (!VALID_REACTIONS.includes(reactionType)) {
    return { userReaction: null, counts: empty, error: 'Invalid reaction type' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { userReaction: null, counts: empty, error: 'Unauthenticated' };

  // Check existing reaction
  const { data: existing } = await supabase
    .from('video_reactions')
    .select('reaction_type')
    .eq('video_id', videoId)
    .eq('user_id', user.id)
    .maybeSingle();

  let newUserReaction: ReactionType | null;

  if (!existing) {
    // INSERT
    await supabase.from('video_reactions').insert({ video_id: videoId, user_id: user.id, reaction_type: reactionType });
    newUserReaction = reactionType;
  } else if (existing.reaction_type === reactionType) {
    // Toggle off (same reaction)
    await supabase.from('video_reactions').delete().eq('video_id', videoId).eq('user_id', user.id);
    newUserReaction = null;
  } else {
    // Change reaction
    await supabase.from('video_reactions').update({ reaction_type: reactionType }).eq('video_id', videoId).eq('user_id', user.id);
    newUserReaction = reactionType;
  }

  // Fetch updated counts
  const { data: rows } = await supabase
    .from('video_reactions')
    .select('reaction_type')
    .eq('video_id', videoId);

  const counts: Record<ReactionType, number> = { heart: 0, amen: 0, laugh: 0, shock: 0 };
  for (const r of (rows ?? []) as { reaction_type: string }[]) {
    if (VALID_REACTIONS.includes(r.reaction_type as ReactionType)) {
      counts[r.reaction_type as ReactionType]++;
    }
  }

  return { userReaction: newUserReaction, counts };
}

// ---------------------------------------------------------------------------
// getVideoReactions  get reaction counts + user's current reaction
// ---------------------------------------------------------------------------
export async function getVideoReactions(videoId: string): Promise<{
  userReaction: ReactionType | null;
  counts: Record<ReactionType, number>;
}> {
  const empty: Record<ReactionType, number> = { heart: 0, amen: 0, laugh: 0, shock: 0 };
  if (!z.string().uuid().safeParse(videoId).success) return { userReaction: null, counts: empty };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rows } = await supabase
    .from('video_reactions')
    .select('user_id, reaction_type')
    .eq('video_id', videoId);

  const counts: Record<ReactionType, number> = { heart: 0, amen: 0, laugh: 0, shock: 0 };
  let userReaction: ReactionType | null = null;

  for (const r of (rows ?? []) as { user_id: string; reaction_type: string }[]) {
    if (VALID_REACTIONS.includes(r.reaction_type as ReactionType)) {
      counts[r.reaction_type as ReactionType]++;
    }
    if (user && r.user_id === user.id) {
      userReaction = r.reaction_type as ReactionType;
    }
  }

  return { userReaction, counts };
}

// ---------------------------------------------------------------------------
// getComments  fetch comments for a video or post
// ---------------------------------------------------------------------------
export async function getComments(
  targetId: string,
  targetType: 'video' | 'post' = 'video'
): Promise<Comment[]> {
  const parsed = z.string().uuid().safeParse(targetId);
  if (!parsed.success) return [];

  const supabase = await createClient();

  const table = targetType === 'post' ? 'post_comments' : 'comments';
  const idField = targetType === 'post' ? 'post_id' : 'video_id';

  const { data } = await supabase
    .from(table)
    .select(`id, ${idField}, user_id, content, created_at`)
    .eq(idField, targetId)
    .order('created_at', { ascending: true })
    .limit(50);

  if (!data || data.length === 0) return [];

  type RawComment = { id: string; user_id: string; content: string; created_at: string } & Record<string, string>;
  const rows = data as RawComment[];
  const ids = [...new Set(rows.map((c) => c.user_id))];
  const profileMap = await fetchProfiles(supabase, ids);

  return rows.map((c) => ({
    id: c.id,
    video_id: targetType === 'video' ? c[idField] : c.id,
    user_id: c.user_id,
    content: c.content,
    created_at: c.created_at,
    profiles: profileMap.get(c.user_id) ?? null,
  })) as Comment[];
}

// ---------------------------------------------------------------------------
// addComment  add a comment to a video or post
// ---------------------------------------------------------------------------
const commentSchema = z.object({
  targetId: z.string().uuid(),
  content: z.string().min(1).max(500).trim(),
  targetType: z.enum(['video', 'post']),
});

export async function addComment(
  targetId: string,
  content: string,
  targetType: 'video' | 'post' = 'video'
): Promise<{ comment?: Comment; error?: string }> {
  const parsed = commentSchema.safeParse({ targetId, content, targetType });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };

  const table = parsed.data.targetType === 'post' ? 'post_comments' : 'comments';
  const idField = parsed.data.targetType === 'post' ? 'post_id' : 'video_id';

  const { data, error } = await supabase
    .from(table)
    .insert({ [idField]: parsed.data.targetId, user_id: user.id, content: parsed.data.content })
    .select(`id, ${idField}, user_id, content, created_at`)
    .single();

  if (error || !data) return { error: error?.message ?? 'Failed to post comment' };

  void logStreakEvent('post_content');

  // Increment comment_count on parent (fire-and-forget)
  if (parsed.data.targetType === 'video') {
    void supabase.rpc('increment_video_comment_count', { p_video_id: parsed.data.targetId });
  } else {
    void supabase.rpc('increment_post_comment_count', { p_post_id: parsed.data.targetId });
  }

  const profileMap = await fetchProfiles(supabase, [user.id]);
  type RawRow = { id: string; user_id: string; content: string; created_at: string } & Record<string, string>;
  const row = data as RawRow;
  const comment: Comment = {
    id: row.id,
    video_id: row[idField],
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    profiles: profileMap.get(user.id) ?? null,
  };
  return { comment };
}

// ---------------------------------------------------------------------------
// createImagePost  create an image post
// ---------------------------------------------------------------------------
const imagePostSchema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().min(1).max(500).trim(),
  verseReference: z.string().max(100).trim().optional(),
  verseText: z.string().max(2000).trim().optional(),
});

export async function createImagePost(
  imageUrl: string,
  caption: string,
  verseReference?: string,
  verseText?: string
): Promise<{ postId: string } | { error: string }> {
  const parsed = imagePostSchema.safeParse({ imageUrl, caption, verseReference, verseText });
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
      content: parsed.data.caption,
      image_url: parsed.data.imageUrl,
      verse_reference: parsed.data.verseReference ?? null,
      verse_text: parsed.data.verseText ?? null,
    })
    .select('id')
    .single();

  if (error || !data) return { error: error?.message ?? 'Failed to create post' };
  void logStreakEvent('post_content');
  return { postId: data.id };
}

// ---------------------------------------------------------------------------
// saveVerse  save a verse to the user's collection
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

  if (!error) void logStreakEvent('verse_save');
  return error ? { error: error.message } : {};
}

// ---------------------------------------------------------------------------
// createPost  create a text post
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
  void logStreakEvent('post_content');
  return { postId: data.id };
}

// ---------------------------------------------------------------------------
// togglePostLike  like/unlike a post; like_count maintained by DB trigger
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
// getPostById  fetch a single post by ID
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
  };

  const { data: row, error } = await supabase
    .from('posts')
    .select('id, user_id, content, image_url, verse_reference, verse_text, like_count, created_at')
    .eq('id', postId)
    .single();

  if (error || !row) return null;
  const r = row as unknown as RawPost;

  const [{ data: commentRows }, profileMap] = await Promise.all([
    supabase.from('post_comments').select('post_id').eq('post_id', postId),
    fetchProfiles(supabase, [r.user_id]),
  ]);
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
    comment_count, user_liked, created_at: r.created_at,
    profiles: profileMap.get(r.user_id) ?? null,
  };
}

// ---------------------------------------------------------------------------
// getUnifiedFeed  merged video + post feed sorted by created_at DESC
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
    video_verses: { verse_reference: string; verse_text: string; position_pct: number }[];
  };

  type RawPost = {
    id: string; user_id: string; content: string; image_url: string | null;
    verse_reference: string | null; verse_text: string | null;
    like_count: number; created_at: string;
  };

  let videoQuery = supabase
    .from('videos')
    .select('id, user_id, url, thumbnail_url, caption, duration_sec, like_count, created_at, video_verses(verse_reference, verse_text, position_pct)')
    .order('created_at', { ascending: false })
    .limit(FEED_BATCH);

  let postQuery = supabase
    .from('posts')
    .select('id, user_id, content, image_url, verse_reference, verse_text, like_count, created_at')
    .order('created_at', { ascending: false })
    .limit(FEED_BATCH);

  if (cursor) {
    videoQuery = videoQuery.lt('created_at', cursor);
    postQuery = postQuery.lt('created_at', cursor);
  }

  const [{ data: videoRows }, { data: postRows }] = await Promise.all([videoQuery, postQuery]);

  const videos = (videoRows ?? []) as unknown as RawVideo[];
  const posts = (postRows ?? []) as unknown as RawPost[];

  const videoIds = videos.map((v) => v.id);
  const postIds = posts.map((p) => p.id);
  const allUserIds = [...new Set([...videos.map((v) => v.user_id), ...posts.map((p) => p.user_id)])];

  const REACTION_TYPES_FEED: ReactionType[] = ['heart', 'amen', 'laugh', 'shock'];

  const [commentMapVideo, commentMapPost, userLikedVideos, userLikedPosts, feedReactionRows, profileMap] = await Promise.all([
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
    videoIds.length > 0
      ? supabase
          .from('video_reactions')
          .select('video_id, user_id, reaction_type')
          .in('video_id', videoIds)
          .then(({ data }) => data ?? [])
      : Promise.resolve([] as { video_id: string; user_id: string; reaction_type: string }[]),
    fetchProfiles(supabase, allUserIds),
  ]);

  // Build reaction maps for feed
  const feedReactionCountMap = new Map<string, Record<ReactionType, number>>();
  const feedUserReactionMap = new Map<string, ReactionType>();
  for (const r of feedReactionRows as { video_id: string; user_id: string; reaction_type: string }[]) {
    if (!feedReactionCountMap.has(r.video_id)) {
      feedReactionCountMap.set(r.video_id, { heart: 0, amen: 0, laugh: 0, shock: 0 });
    }
    const counts = feedReactionCountMap.get(r.video_id)!;
    if (REACTION_TYPES_FEED.includes(r.reaction_type as ReactionType)) {
      counts[r.reaction_type as ReactionType]++;
    }
    if (user && r.user_id === user.id) {
      feedUserReactionMap.set(r.video_id, r.reaction_type as ReactionType);
    }
  }

  const videoItems: FeedItem[] = videos.map((v) => ({
    kind: 'video' as const,
    data: {
      id: v.id, user_id: v.user_id, url: v.url, thumbnail_url: v.thumbnail_url,
      caption: v.caption, duration_sec: v.duration_sec, created_at: v.created_at,
      like_count: v.like_count ?? 0,
      comment_count: commentMapVideo.get(v.id) ?? 0,
      user_liked: userLikedVideos.has(v.id),
      user_reaction: feedUserReactionMap.get(v.id) ?? null,
      reaction_counts: feedReactionCountMap.get(v.id) ?? { heart: 0, amen: 0, laugh: 0, shock: 0 },
      verse: v.video_verses?.[0] ?? null,
      profiles: profileMap.get(v.user_id) ?? null,
    },
  }));

  const postItems: FeedItem[] = posts.map((p) => {
    const base = {
      id: p.id, user_id: p.user_id, content: p.content, image_url: p.image_url,
      verse_reference: p.verse_reference, verse_text: p.verse_text,
      like_count: p.like_count ?? 0,
      comment_count: commentMapPost.get(p.id) ?? 0,
      user_liked: userLikedPosts.has(p.id),
      created_at: p.created_at, profiles: profileMap.get(p.user_id) ?? null,
    };
    if (p.image_url) {
      return { kind: 'image' as const, data: base as ImagePost };
    }
    return { kind: 'post' as const, data: base as Post };
  });

  // Merge and sort by created_at DESC, take first 5
  const merged = [...videoItems, ...postItems].sort(
    (a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
  );

  const PAGE = 5;
  const page = merged.slice(0, PAGE);
  const nextCursor = merged.length > PAGE ? page[page.length - 1].data.created_at : null;

  return { items: page, nextCursor };
}

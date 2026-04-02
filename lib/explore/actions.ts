'use server';

import { createClient } from '../supabase/server';
import { logDailyEngagement } from '../streaks/actions';
import type {
  Video,
  Comment,
  Post,
  ImagePost,
  Repost,
  FeedItem,
  ReactionType,
  VerseComment,
} from './types';

const PAGE = 15;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function batchProfiles(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, { username: string; avatar_url: string | null }>> {
  if (!ids.length) return new Map();
  const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', ids);
  return new Map(
    (data ?? []).map((p) => [
      p.id as string,
      { username: p.username as string, avatar_url: p.avatar_url as string | null },
    ])
  );
}

async function enrichVideos(
  supabase: SupabaseClient,
  userId: string,
  rows: Record<string, unknown>[]
): Promise<Video[]> {
  if (!rows.length) return [];

  const videoIds = rows.map((v) => v.id as string);
  const userIds = [...new Set(rows.map((v) => v.user_id as string))];

  const [profileMap, likesRes, reactionsRes, versesRes] = await Promise.all([
    batchProfiles(supabase, userIds),
    supabase
      .from('likes')
      .select('video_id')
      .eq('user_id', userId)
      .in('video_id', videoIds),
    supabase
      .from('video_reactions')
      .select('video_id, user_id, reaction_type')
      .in('video_id', videoIds),
    supabase
      .from('video_verses')
      .select('video_id, verse_reference, verse_text, position_pct')
      .in('video_id', videoIds),
  ]);

  const likedSet = new Set((likesRes.data ?? []).map((l) => l.video_id as string));

  const reactionCountMap = new Map<string, Record<ReactionType, number>>();
  const userReactionMap = new Map<string, ReactionType>();
  for (const r of (reactionsRes.data ?? []) as {
    video_id: string;
    user_id: string;
    reaction_type: string;
  }[]) {
    if (!reactionCountMap.has(r.video_id)) {
      reactionCountMap.set(r.video_id, { heart: 0, amen: 0, laugh: 0, shock: 0 });
    }
    const rt = r.reaction_type as ReactionType;
    reactionCountMap.get(r.video_id)![rt]++;
    if (r.user_id === userId) userReactionMap.set(r.video_id, rt);
  }

  const verseMap = new Map(
    (versesRes.data ?? []).map((v) => [
      v.video_id as string,
      {
        verse_reference: v.verse_reference as string,
        verse_text: v.verse_text as string,
        position_pct: v.position_pct as number,
      },
    ])
  );

  return rows.map((v) => ({
    id: v.id as string,
    user_id: v.user_id as string,
    url: v.url as string,
    caption: v.caption as string | null,
    thumbnail_url: v.thumbnail_url as string | null,
    duration_sec: v.duration_sec as number | null,
    like_count: v.like_count as number,
    comment_count: v.comment_count as number,
    user_liked: likedSet.has(v.id as string),
    user_reaction: userReactionMap.get(v.id as string) ?? null,
    reaction_counts: reactionCountMap.get(v.id as string) ?? {
      heart: 0,
      amen: 0,
      laugh: 0,
      shock: 0,
    },
    created_at: v.created_at as string,
    verse: verseMap.get(v.id as string) ?? null,
    profiles: profileMap.get(v.user_id as string) ?? null,
  }));
}

async function enrichPosts(
  supabase: SupabaseClient,
  userId: string,
  rows: Record<string, unknown>[]
): Promise<Post[]> {
  if (!rows.length) return [];

  const postIds = rows.map((p) => p.id as string);
  const userIds = [...new Set(rows.map((p) => p.user_id as string))];

  const [profileMap, likesRes] = await Promise.all([
    batchProfiles(supabase, userIds),
    supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds),
  ]);

  const likedSet = new Set((likesRes.data ?? []).map((l) => l.post_id as string));

  return rows.map((p) => ({
    id: p.id as string,
    user_id: p.user_id as string,
    content: p.content as string,
    image_url: p.image_url as string | null,
    verse_reference: p.verse_reference as string | null,
    verse_text: p.verse_text as string | null,
    like_count: p.like_count as number,
    comment_count: p.comment_count as number,
    reply_count: p.reply_count as number,
    user_liked: likedSet.has(p.id as string),
    thread_root_id: p.thread_root_id as string | null,
    reply_to_post_id: p.reply_to_post_id as string | null,
    created_at: p.created_at as string,
    profiles: profileMap.get(p.user_id as string) ?? null,
  }));
}

// ---------------------------------------------------------------------------
// getVideos — paginated video feed
// ---------------------------------------------------------------------------
export async function getVideos(cursor?: string): Promise<{
  videos: Video[];
  nextCursor: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { videos: [], nextCursor: null };

  let q = supabase
    .from('videos')
    .select(
      'id, user_id, url, caption, thumbnail_url, duration_sec, like_count, comment_count, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(PAGE);

  if (cursor) q = q.lt('created_at', cursor);

  const { data } = await q;
  if (!data?.length) return { videos: [], nextCursor: null };

  const videos = await enrichVideos(supabase, user.id, data as Record<string, unknown>[]);
  const nextCursor = data.length === PAGE ? (data[data.length - 1].created_at as string) : null;

  return { videos, nextCursor };
}

// ---------------------------------------------------------------------------
// getVideoById
// ---------------------------------------------------------------------------
export async function getVideoById(videoId: string): Promise<Video | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('videos')
    .select(
      'id, user_id, url, caption, thumbnail_url, duration_sec, like_count, comment_count, created_at'
    )
    .eq('id', videoId)
    .single();

  if (!data) return null;
  const videos = await enrichVideos(supabase, user.id, [data as Record<string, unknown>]);
  return videos[0] ?? null;
}

// ---------------------------------------------------------------------------
// toggleLike — video simple like (uses likes table)
// ---------------------------------------------------------------------------
export async function toggleLike(
  videoId: string
): Promise<{ liked: boolean; likeCount: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { liked: false, likeCount: 0, error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('likes')
    .select('video_id')
    .eq('user_id', user.id)
    .eq('video_id', videoId)
    .maybeSingle();

  if (existing) {
    await supabase.from('likes').delete().eq('user_id', user.id).eq('video_id', videoId);
  } else {
    await supabase.from('likes').insert({ user_id: user.id, video_id: videoId });
  }

  const { data: video } = await supabase
    .from('videos')
    .select('like_count')
    .eq('id', videoId)
    .single();

  return { liked: !existing, likeCount: (video as { like_count?: number } | null)?.like_count ?? 0 };
}

// ---------------------------------------------------------------------------
// toggleReaction — video reaction (uses video_reactions table)
// ---------------------------------------------------------------------------
export async function toggleReaction(
  videoId: string,
  reactionType: ReactionType
): Promise<{
  userReaction: ReactionType | null;
  counts: Record<ReactionType, number>;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const empty = { userReaction: null as ReactionType | null, counts: { heart: 0, amen: 0, laugh: 0, shock: 0 } };
  if (!user) return { ...empty, error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('video_reactions')
    .select('reaction_type')
    .eq('user_id', user.id)
    .eq('video_id', videoId)
    .maybeSingle();

  if (existing) {
    if ((existing as { reaction_type: string }).reaction_type === reactionType) {
      // Same reaction — remove it
      await supabase
        .from('video_reactions')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);
    } else {
      // Different reaction — update
      await supabase
        .from('video_reactions')
        .update({ reaction_type: reactionType })
        .eq('user_id', user.id)
        .eq('video_id', videoId);
    }
  } else {
    await supabase
      .from('video_reactions')
      .insert({ user_id: user.id, video_id: videoId, reaction_type: reactionType });
  }

  return getVideoReactions(videoId);
}

// ---------------------------------------------------------------------------
// getVideoReactions
// ---------------------------------------------------------------------------
export async function getVideoReactions(videoId: string): Promise<{
  userReaction: ReactionType | null;
  counts: Record<ReactionType, number>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from('video_reactions')
    .select('user_id, reaction_type')
    .eq('video_id', videoId);

  const counts: Record<ReactionType, number> = { heart: 0, amen: 0, laugh: 0, shock: 0 };
  let userReaction: ReactionType | null = null;

  for (const r of (data ?? []) as { user_id: string; reaction_type: string }[]) {
    const rt = r.reaction_type as ReactionType;
    counts[rt] = (counts[rt] ?? 0) + 1;
    if (user && r.user_id === user.id) userReaction = rt;
  }

  return { userReaction, counts };
}

// ---------------------------------------------------------------------------
// getComments — video or post comments
// ---------------------------------------------------------------------------
export async function getComments(
  targetId: string,
  targetType: 'video' | 'post' = 'video'
): Promise<Comment[]> {
  const supabase = await createClient();

  const table = targetType === 'video' ? 'comments' : 'post_comments';
  const idCol = targetType === 'video' ? 'video_id' : 'post_id';

  const { data } = await supabase
    .from(table)
    .select(`id, ${idCol}, user_id, content, created_at`)
    .eq(idCol, targetId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (!data?.length) return [];

  const userIds = [...new Set(data.map((c) => c.user_id as string))];
  const profileMap = await batchProfiles(supabase, userIds);

  return data.map((c) => ({
    id: c.id as string,
    video_id: targetId,
    user_id: c.user_id as string,
    content: c.content as string,
    created_at: c.created_at as string,
    profiles: profileMap.get(c.user_id as string) ?? null,
  }));
}

// ---------------------------------------------------------------------------
// addComment
// ---------------------------------------------------------------------------
export async function addComment(
  targetId: string,
  content: string,
  targetType: 'video' | 'post' = 'video'
): Promise<{ comment?: Comment; error?: string; code?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated', code: 'JA-1003' };
  if (!content.trim()) return { error: 'Comment cannot be empty' };

  const table = targetType === 'video' ? 'comments' : 'post_comments';
  const idCol = targetType === 'video' ? 'video_id' : 'post_id';

  const { data, error } = await supabase
    .from(table)
    .insert({ [idCol]: targetId, user_id: user.id, content: content.trim() })
    .select('id, user_id, content, created_at')
    .single();

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  const comment: Comment = {
    id: (data as { id: string }).id,
    video_id: targetId,
    user_id: user.id,
    content: (data as { content: string }).content,
    created_at: (data as { created_at: string }).created_at,
    profiles: profile
      ? {
          username: (profile as { username: string }).username,
          avatar_url: (profile as { avatar_url: string | null }).avatar_url,
        }
      : null,
  };

  return { comment };
}

// ---------------------------------------------------------------------------
// createImagePost
// ---------------------------------------------------------------------------
export async function createImagePost(
  imageUrl: string,
  caption: string,
  verseReference?: string,
  verseText?: string
): Promise<{ post?: ImagePost; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      content: caption,
      image_url: imageUrl,
      verse_reference: verseReference || null,
      verse_text: verseText || null,
    })
    .select('id, user_id, content, image_url, verse_reference, verse_text, like_count, comment_count, created_at')
    .single();

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  const row = data as Record<string, unknown>;
  const post: ImagePost = {
    id: row.id as string,
    user_id: row.user_id as string,
    content: row.content as string,
    image_url: row.image_url as string,
    verse_reference: row.verse_reference as string | null,
    verse_text: row.verse_text as string | null,
    like_count: row.like_count as number,
    comment_count: row.comment_count as number,
    user_liked: false,
    created_at: row.created_at as string,
    profiles: profile
      ? {
          username: (profile as { username: string }).username,
          avatar_url: (profile as { avatar_url: string | null }).avatar_url,
        }
      : null,
  };

  return { post };
}

// ---------------------------------------------------------------------------
// saveVerse
// ---------------------------------------------------------------------------
export async function saveVerse(
  verseReference: string,
  verseText: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('saved_verses')
    .upsert(
      { user_id: user.id, verse_reference: verseReference, verse_text: verseText },
      { onConflict: 'user_id,verse_reference', ignoreDuplicates: true }
    );

  if (error) return { error: error.message };

  await logDailyEngagement(user.id);
  return {};
}

// ---------------------------------------------------------------------------
// createPost
// ---------------------------------------------------------------------------
export async function createPost(
  content: string,
  verseReference?: string,
  verseText?: string
): Promise<{ post?: Post; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      content,
      verse_reference: verseReference || null,
      verse_text: verseText || null,
    })
    .select(
      'id, user_id, content, image_url, verse_reference, verse_text, like_count, comment_count, reply_count, thread_root_id, reply_to_post_id, created_at'
    )
    .single();

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  const row = data as Record<string, unknown>;
  const post: Post = {
    id: row.id as string,
    user_id: row.user_id as string,
    content: row.content as string,
    image_url: row.image_url as string | null,
    verse_reference: row.verse_reference as string | null,
    verse_text: row.verse_text as string | null,
    like_count: row.like_count as number,
    comment_count: row.comment_count as number,
    reply_count: row.reply_count as number,
    user_liked: false,
    thread_root_id: row.thread_root_id as string | null,
    reply_to_post_id: row.reply_to_post_id as string | null,
    created_at: row.created_at as string,
    profiles: profile
      ? {
          username: (profile as { username: string }).username,
          avatar_url: (profile as { avatar_url: string | null }).avatar_url,
        }
      : null,
  };

  return { post };
}

// ---------------------------------------------------------------------------
// createRepost
// ---------------------------------------------------------------------------
export async function createRepost(
  originalPostId: string,
  originalType: 'video' | 'post',
  quoteContent?: string,
  quoteVerseRef?: string,
  quoteVerseText?: string
): Promise<{ repost?: Repost; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('reposts')
    .insert({
      user_id: user.id,
      original_post_id: originalPostId,
      original_type: originalType,
      quote_content: quoteContent || null,
      quote_verse_ref: quoteVerseRef || null,
      quote_verse_text: quoteVerseText || null,
    })
    .select('id, user_id, original_post_id, original_type, quote_content, quote_verse_ref, quote_verse_text, created_at')
    .single();

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  const row = data as Record<string, unknown>;
  const repost: Repost = {
    id: row.id as string,
    user_id: row.user_id as string,
    original_post_id: row.original_post_id as string,
    original_type: row.original_type as 'video' | 'post',
    quote_content: row.quote_content as string | null,
    quote_verse_ref: row.quote_verse_ref as string | null,
    quote_verse_text: row.quote_verse_text as string | null,
    created_at: row.created_at as string,
    profiles: profile
      ? {
          username: (profile as { username: string }).username,
          avatar_url: (profile as { avatar_url: string | null }).avatar_url,
        }
      : null,
  };

  return { repost };
}

// ---------------------------------------------------------------------------
// deleteRepost
// ---------------------------------------------------------------------------
export async function deleteRepost(repostId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('reposts')
    .delete()
    .eq('id', repostId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

// ---------------------------------------------------------------------------
// addThreadReply
// ---------------------------------------------------------------------------
export async function addThreadReply(
  rootPostId: string,
  replyToPostId: string,
  content: string,
  verseReference?: string,
  verseText?: string
): Promise<{ post?: Post; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      content,
      thread_root_id: rootPostId,
      reply_to_post_id: replyToPostId,
      verse_reference: verseReference || null,
      verse_text: verseText || null,
    })
    .select(
      'id, user_id, content, image_url, verse_reference, verse_text, like_count, comment_count, reply_count, thread_root_id, reply_to_post_id, created_at'
    )
    .single();

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  const row = data as Record<string, unknown>;
  const post: Post = {
    id: row.id as string,
    user_id: row.user_id as string,
    content: row.content as string,
    image_url: row.image_url as string | null,
    verse_reference: row.verse_reference as string | null,
    verse_text: row.verse_text as string | null,
    like_count: row.like_count as number,
    comment_count: row.comment_count as number,
    reply_count: row.reply_count as number,
    user_liked: false,
    thread_root_id: row.thread_root_id as string | null,
    reply_to_post_id: row.reply_to_post_id as string | null,
    created_at: row.created_at as string,
    profiles: profile
      ? {
          username: (profile as { username: string }).username,
          avatar_url: (profile as { avatar_url: string | null }).avatar_url,
        }
      : null,
  };

  return { post };
}

// ---------------------------------------------------------------------------
// togglePostLike
// ---------------------------------------------------------------------------
export async function togglePostLike(
  postId: string
): Promise<{ liked: boolean; likeCount: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { liked: false, likeCount: 0, error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle();

  if (existing) {
    await supabase.from('post_likes').delete().eq('user_id', user.id).eq('post_id', postId);
  } else {
    await supabase.from('post_likes').insert({ user_id: user.id, post_id: postId });
  }

  const { data: post } = await supabase
    .from('posts')
    .select('like_count')
    .eq('id', postId)
    .single();

  return {
    liked: !existing,
    likeCount: (post as { like_count?: number } | null)?.like_count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// getPostById
// ---------------------------------------------------------------------------
export async function getPostById(postId: string): Promise<Post | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('posts')
    .select(
      'id, user_id, content, image_url, verse_reference, verse_text, like_count, comment_count, reply_count, thread_root_id, reply_to_post_id, created_at'
    )
    .eq('id', postId)
    .single();

  if (!data) return null;
  const posts = await enrichPosts(supabase, user.id, [data as Record<string, unknown>]);
  return posts[0] ?? null;
}

// ---------------------------------------------------------------------------
// getThread
// ---------------------------------------------------------------------------
export async function getThread(
  rootPostId: string
): Promise<{ root: Post; replies: Post[] } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [rootRes, repliesRes] = await Promise.all([
    supabase
      .from('posts')
      .select(
        'id, user_id, content, image_url, verse_reference, verse_text, like_count, comment_count, reply_count, thread_root_id, reply_to_post_id, created_at'
      )
      .eq('id', rootPostId)
      .single(),
    supabase
      .from('posts')
      .select(
        'id, user_id, content, image_url, verse_reference, verse_text, like_count, comment_count, reply_count, thread_root_id, reply_to_post_id, created_at'
      )
      .eq('thread_root_id', rootPostId)
      .order('created_at', { ascending: true }),
  ]);

  if (!rootRes.data) return null;

  const allRows = [rootRes.data, ...(repliesRes.data ?? [])] as Record<string, unknown>[];
  const enriched = await enrichPosts(supabase, user.id, allRows);

  return { root: enriched[0], replies: enriched.slice(1) };
}

// ---------------------------------------------------------------------------
// getUnifiedFeed — videos + top-level posts merged, newest first
// ---------------------------------------------------------------------------
export async function getUnifiedFeed(cursor?: string): Promise<{
  items: FeedItem[];
  nextCursor: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], nextCursor: null };

  const half = Math.ceil(PAGE / 2);

  let vq = supabase
    .from('videos')
    .select(
      'id, user_id, url, caption, thumbnail_url, duration_sec, like_count, comment_count, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(half);
  if (cursor) vq = vq.lt('created_at', cursor);

  let pq = supabase
    .from('posts')
    .select(
      'id, user_id, content, image_url, verse_reference, verse_text, like_count, comment_count, reply_count, thread_root_id, reply_to_post_id, created_at'
    )
    .is('reply_to_post_id', null)
    .order('created_at', { ascending: false })
    .limit(half);
  if (cursor) pq = pq.lt('created_at', cursor);

  const [{ data: videoRows }, { data: postRows }] = await Promise.all([vq, pq]);

  const [videos, posts] = await Promise.all([
    enrichVideos(supabase, user.id, (videoRows ?? []) as Record<string, unknown>[]),
    enrichPosts(supabase, user.id, (postRows ?? []) as Record<string, unknown>[]),
  ]);

  const merged: FeedItem[] = [
    ...videos.map((v): FeedItem => ({ kind: 'video', data: v })),
    ...posts.map((p): FeedItem => {
      if (p.image_url) return { kind: 'image', data: p as unknown as import('./types').ImagePost };
      return { kind: 'post', data: p };
    }),
  ].sort((a, b) => b.data.created_at.localeCompare(a.data.created_at));

  const page = merged.slice(0, PAGE);
  const nextCursor = page.length === PAGE ? page[page.length - 1].data.created_at : null;

  return { items: page, nextCursor };
}

// ---------------------------------------------------------------------------
// getFollowingFeed — same as unified but filtered to followed users
// ---------------------------------------------------------------------------
export async function getFollowingFeed(cursor?: string): Promise<{
  items: FeedItem[];
  nextCursor: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], nextCursor: null };

  const { data: follows } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', user.id);

  if (!follows?.length) return { items: [], nextCursor: null };
  const followedIds = follows.map((f) => f.following_id as string);

  const half = Math.ceil(PAGE / 2);

  let vq = supabase
    .from('videos')
    .select(
      'id, user_id, url, caption, thumbnail_url, duration_sec, like_count, comment_count, created_at'
    )
    .in('user_id', followedIds)
    .order('created_at', { ascending: false })
    .limit(half);
  if (cursor) vq = vq.lt('created_at', cursor);

  let pq = supabase
    .from('posts')
    .select(
      'id, user_id, content, image_url, verse_reference, verse_text, like_count, comment_count, reply_count, thread_root_id, reply_to_post_id, created_at'
    )
    .in('user_id', followedIds)
    .is('reply_to_post_id', null)
    .order('created_at', { ascending: false })
    .limit(half);
  if (cursor) pq = pq.lt('created_at', cursor);

  const [{ data: videoRows }, { data: postRows }] = await Promise.all([vq, pq]);

  const [videos, posts] = await Promise.all([
    enrichVideos(supabase, user.id, (videoRows ?? []) as Record<string, unknown>[]),
    enrichPosts(supabase, user.id, (postRows ?? []) as Record<string, unknown>[]),
  ]);

  const merged: FeedItem[] = [
    ...videos.map((v): FeedItem => ({ kind: 'video', data: v })),
    ...posts.map((p): FeedItem => {
      if (p.image_url) return { kind: 'image', data: p as unknown as import('./types').ImagePost };
      return { kind: 'post', data: p };
    }),
  ].sort((a, b) => b.data.created_at.localeCompare(a.data.created_at));

  const page = merged.slice(0, PAGE);
  const nextCursor = page.length === PAGE ? page[page.length - 1].data.created_at : null;

  return { items: page, nextCursor };
}

// ---------------------------------------------------------------------------
// toggleVerseLike — daily_verse_likes table
// ---------------------------------------------------------------------------
export async function toggleVerseLike(
  verseReference: string,
  verseDate?: string
): Promise<{ liked: boolean; likeCount: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { liked: false, likeCount: 0, error: 'Not authenticated' };

  const date = verseDate ?? new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from('daily_verse_likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('verse_reference', verseReference)
    .eq('verse_date', date)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('daily_verse_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('verse_reference', verseReference)
      .eq('verse_date', date);
  } else {
    await supabase
      .from('daily_verse_likes')
      .insert({ user_id: user.id, verse_reference: verseReference, verse_date: date });
  }

  const { count } = await supabase
    .from('daily_verse_likes')
    .select('user_id', { count: 'exact', head: true })
    .eq('verse_reference', verseReference)
    .eq('verse_date', date);

  return { liked: !existing, likeCount: count ?? 0 };
}

// ---------------------------------------------------------------------------
// getVerseEngagement
// ---------------------------------------------------------------------------
export async function getVerseEngagement(verseReference: string): Promise<{
  likeCount: number;
  userLiked: boolean;
  commentCount: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);

  const [likesRes, userLikeRes, commentRes] = await Promise.all([
    supabase
      .from('daily_verse_likes')
      .select('user_id', { count: 'exact', head: true })
      .eq('verse_reference', verseReference)
      .eq('verse_date', today),
    user
      ? supabase
          .from('daily_verse_likes')
          .select('user_id')
          .eq('user_id', user.id)
          .eq('verse_reference', verseReference)
          .eq('verse_date', today)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('daily_verse_comments')
      .select('id', { count: 'exact', head: true })
      .eq('verse_reference', verseReference),
  ]);

  return {
    likeCount: likesRes.count ?? 0,
    userLiked: !!(userLikeRes as { data: unknown }).data,
    commentCount: commentRes.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// addVerseComment
// ---------------------------------------------------------------------------
export async function addVerseComment(
  verseReference: string,
  body: string,
  verseDate?: string
): Promise<{ comment?: VerseComment; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const date = verseDate ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('daily_verse_comments')
    .insert({ user_id: user.id, verse_reference: verseReference, verse_date: date, body })
    .select('id, user_id, verse_reference, verse_date, body, created_at')
    .single();

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single();

  const row = data as Record<string, unknown>;
  const comment: VerseComment = {
    id: row.id as string,
    user_id: row.user_id as string,
    verse_reference: row.verse_reference as string,
    verse_date: row.verse_date as string,
    body: row.body as string,
    created_at: row.created_at as string,
    profiles: profile
      ? {
          username: (profile as { username: string }).username,
          avatar_url: (profile as { avatar_url: string | null }).avatar_url,
        }
      : null,
  };

  return { comment };
}

// ---------------------------------------------------------------------------
// getVerseComments
// ---------------------------------------------------------------------------
export async function getVerseComments(verseReference: string): Promise<VerseComment[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('daily_verse_comments')
    .select('id, user_id, verse_reference, verse_date, body, created_at')
    .eq('verse_reference', verseReference)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!data?.length) return [];

  const userIds = [...new Set(data.map((c) => c.user_id as string))];
  const profileMap = await batchProfiles(supabase, userIds);

  return data.map((c) => ({
    id: c.id as string,
    user_id: c.user_id as string,
    verse_reference: c.verse_reference as string,
    verse_date: c.verse_date as string,
    body: c.body as string,
    created_at: c.created_at as string,
    profiles: profileMap.get(c.user_id as string) ?? null,
  }));
}

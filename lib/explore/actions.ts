'use server';

import type { Video, Comment, Post, ImagePost, Repost, FeedItem, ReactionType, VerseComment } from './types';

// ---------------------------------------------------------------------------
// Stub: no-op daily engagement tracker
// ---------------------------------------------------------------------------
async function logDailyEngagement(): Promise<void> {}

// ---------------------------------------------------------------------------
// getVideos
// ---------------------------------------------------------------------------
export async function getVideos(_cursor?: string): Promise<{
  videos: Video[];
  nextCursor: string | null;
}> {
  return { videos: [], nextCursor: null };
}

// ---------------------------------------------------------------------------
// getVideoById
// ---------------------------------------------------------------------------
export async function getVideoById(_videoId: string): Promise<Video | null> {
  return null;
}

// ---------------------------------------------------------------------------
// toggleLike
// ---------------------------------------------------------------------------
export async function toggleLike(
  _videoId: string
): Promise<{ liked: boolean; likeCount: number; error?: string }> {
  return { liked: false, likeCount: 0 };
}

// ---------------------------------------------------------------------------
// toggleReaction
// ---------------------------------------------------------------------------
export async function toggleReaction(
  _videoId: string,
  _reactionType: ReactionType
): Promise<{
  userReaction: ReactionType | null;
  counts: Record<ReactionType, number>;
  error?: string;
}> {
  return { userReaction: null, counts: { heart: 0, amen: 0, laugh: 0, shock: 0 } };
}

// ---------------------------------------------------------------------------
// getVideoReactions
// ---------------------------------------------------------------------------
export async function getVideoReactions(_videoId: string): Promise<{
  userReaction: ReactionType | null;
  counts: Record<ReactionType, number>;
}> {
  return { userReaction: null, counts: { heart: 0, amen: 0, laugh: 0, shock: 0 } };
}

// ---------------------------------------------------------------------------
// getComments
// ---------------------------------------------------------------------------
export async function getComments(
  _targetId: string,
  _targetType: 'video' | 'post' = 'video'
): Promise<Comment[]> {
  return [];
}

// ---------------------------------------------------------------------------
// addComment
// ---------------------------------------------------------------------------
export async function addComment(
  _targetId: string,
  _content: string,
  _targetType: 'video' | 'post' = 'video'
): Promise<{ comment?: Comment; error?: string; code?: string }> {
  return {};
}

// ---------------------------------------------------------------------------
// createImagePost
// ---------------------------------------------------------------------------
export async function createImagePost(
  _imageUrl: string,
  _caption: string,
  _verseReference?: string,
  _verseText?: string
): Promise<{ post?: ImagePost; error?: string }> {
  return {};
}

// ---------------------------------------------------------------------------
// saveVerse
// ---------------------------------------------------------------------------
export async function saveVerse(
  _verseReference: string,
  _verseText: string
): Promise<{ error?: string }> {
  await logDailyEngagement();
  return {};
}

// ---------------------------------------------------------------------------
// createPost
// ---------------------------------------------------------------------------
export async function createPost(
  _content: string,
  _verseReference?: string,
  _verseText?: string
): Promise<{ post?: Post; error?: string }> {
  return {};
}

// ---------------------------------------------------------------------------
// createRepost
// ---------------------------------------------------------------------------
export async function createRepost(
  _originalPostId: string,
  _originalType: 'video' | 'post',
  _quoteContent?: string,
  _quoteVerseRef?: string,
  _quoteVerseText?: string
): Promise<{ repost?: Repost; error?: string }> {
  return {};
}

// ---------------------------------------------------------------------------
// deleteRepost
// ---------------------------------------------------------------------------
export async function deleteRepost(_repostId: string): Promise<{ error?: string }> {
  return {};
}

// ---------------------------------------------------------------------------
// addThreadReply
// ---------------------------------------------------------------------------
export async function addThreadReply(
  _rootPostId: string,
  _replyToPostId: string,
  _content: string,
  _verseReference?: string,
  _verseText?: string
): Promise<{ post?: Post; error?: string }> {
  return {};
}

// ---------------------------------------------------------------------------
// togglePostLike
// ---------------------------------------------------------------------------
export async function togglePostLike(
  _postId: string
): Promise<{ liked: boolean; likeCount: number; error?: string }> {
  return { liked: false, likeCount: 0 };
}

// ---------------------------------------------------------------------------
// getPostById
// ---------------------------------------------------------------------------
export async function getPostById(_postId: string): Promise<Post | null> {
  return null;
}

// ---------------------------------------------------------------------------
// getThread
// ---------------------------------------------------------------------------
export async function getThread(
  _rootPostId: string
): Promise<{ root: Post; replies: Post[] } | null> {
  return null;
}

// ---------------------------------------------------------------------------
// getUnifiedFeed
// ---------------------------------------------------------------------------
export async function getUnifiedFeed(_cursor?: string): Promise<{
  items: FeedItem[];
  nextCursor: string | null;
}> {
  return { items: [], nextCursor: null };
}

// ---------------------------------------------------------------------------
// getFollowingFeed
// ---------------------------------------------------------------------------
export async function getFollowingFeed(_cursor?: string): Promise<{
  items: FeedItem[];
  nextCursor: string | null;
}> {
  return { items: [], nextCursor: null };
}

// ---------------------------------------------------------------------------
// toggleVerseLike
// ---------------------------------------------------------------------------
export async function toggleVerseLike(
  _verseReference: string,
  _verseDate?: string
): Promise<{ liked: boolean; likeCount: number; error?: string }> {
  return { liked: false, likeCount: 0 };
}

// ---------------------------------------------------------------------------
// getVerseEngagement
// ---------------------------------------------------------------------------
export async function getVerseEngagement(_verseReference: string): Promise<{
  likeCount: number;
  userLiked: boolean;
  commentCount: number;
}> {
  return { likeCount: 0, userLiked: false, commentCount: 0 };
}

// ---------------------------------------------------------------------------
// addVerseComment
// ---------------------------------------------------------------------------
export async function addVerseComment(
  _verseReference: string,
  _body: string,
  _verseDate?: string
): Promise<{ comment?: VerseComment; error?: string }> {
  return {};
}

// ---------------------------------------------------------------------------
// getVerseComments
// ---------------------------------------------------------------------------
export async function getVerseComments(_verseReference: string): Promise<VerseComment[]> {
  return [];
}

export type VideoVerse = {
  verse_reference: string;
  verse_text: string;
  position_pct: number;
};

export type ReactionType = 'heart' | 'amen' | 'laugh' | 'shock';

export type Video = {
  id: string;
  user_id: string;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  duration_sec: number | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  user_liked: boolean;
  user_reaction: ReactionType | null;
  reaction_counts: Record<ReactionType, number>;
  verse: VideoVerse | null;
  profiles: { username: string; avatar_url: string | null } | null;
};

export type Comment = {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

export type DailyVerseType = {
  reference: string;
  text: string;
  reflection: string;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  verse_reference: string | null;
  verse_text: string | null;
  like_count: number;
  comment_count: number;
  user_liked: boolean;
  created_at: string;
  thread_root_id: string | null;
  reply_to_post_id: string | null;
  reply_count: number;
  profiles: { username: string; avatar_url: string | null } | null;
};

export type ImagePost = {
  id: string;
  user_id: string;
  content: string;
  image_url: string;
  verse_reference: string | null;
  verse_text: string | null;
  like_count: number;
  comment_count: number;
  user_liked: boolean;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

export type Repost = {
  id: string;
  user_id: string;
  original_post_id: string;
  original_type: 'video' | 'post';
  quote_content: string | null;
  quote_verse_ref: string | null;
  quote_verse_text: string | null;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
  original?: Video | Post | ImagePost | null;
};

export type FeedItem =
  | { kind: 'video'; data: Video }
  | { kind: 'post'; data: Post }
  | { kind: 'image'; data: ImagePost }
  | { kind: 'repost'; data: Repost };

export type VerseComment = {
  id: string;
  user_id: string;
  verse_reference: string;
  verse_date: string;
  body: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

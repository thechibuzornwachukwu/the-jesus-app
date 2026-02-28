export type VideoVerse = {
  verse_reference: string;
  verse_text: string;
  position_pct: number;
};

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

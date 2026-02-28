export interface FullProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  church_name: string | null;
  city: string | null;
  is_public: boolean;
  content_categories: string[];
  deleted_at: string | null;
}

export interface SavedVerse {
  verse_reference: string;
  verse_text: string;
  saved_at: string;
}

export interface JoinedCell {
  role: string;
  cell: {
    id: string;
    slug: string | null;
    name: string;
    category: string | null;
    avatar_url: string | null;
    banner_url: string | null;
  };
}

export interface Post {
  id: string;
  content: string;
  verse_reference: string | null;
  verse_text: string | null;
  like_count: number;
  created_at: string;
}

export interface PostedVideo {
  id: string;
  thumbnail_url: string | null;
  caption: string | null;
  created_at: string;
  like_count: number;
}

export interface AppNotification {
  id: string;
  type: 'like' | 'comment' | 'mention';
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  actor: {
    username: string;
    avatar_url: string | null;
  } | null;
}

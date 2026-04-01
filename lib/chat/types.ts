export type LinkPreviewType = 'video' | 'testimony' | 'external';

export interface LinkPreview {
  type: LinkPreviewType;
  url: string;
  // video
  thumbnail_url?: string;
  title?: string;
  author_name?: string;
  // testimony
  category?: string;
  excerpt?: string;
  // external
  og_title?: string;
  og_image?: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  link_preview: LinkPreview | null;
  created_at: string;
  read_at: string | null;
}

export interface Conversation {
  id: string;
  participant: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
}

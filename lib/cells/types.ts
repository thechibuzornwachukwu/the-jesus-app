export type MessageType = 'text' | 'audio' | 'image';

export type Cell = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  avatar_url: string | null;
  banner_url?: string | null;
  rules?: string | null;
  member_limit?: number;
  creator_id: string;
  is_public: boolean;
  created_at: string;
  member_count?: number;
};

export type CellMember = {
  cell_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
};

export type CellMemberWithProfile = {
  cell_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
};

export type CellInvite = {
  id: string;
  cell_id: string;
  code: string;
  created_by: string;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  created_at: string;
};

export type Message = {
  id: string;
  cell_id: string;
  user_id: string;
  content: string | null;
  message_type: MessageType;
  audio_url: string | null;
  created_at: string;
  reply_to_message_id?: string | null;
  reply_to_timestamp_seconds?: number | null;
  profiles?: { username: string; avatar_url: string | null };
};

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
};

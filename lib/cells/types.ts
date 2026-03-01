export type MessageType = 'text' | 'audio' | 'image' | 'gif';

// ─── Phase 7A: Channels ────────────────────────────────────────────────────

export type ChannelType = 'text' | 'announcement' | 'meeting';

export type Channel = {
  id: string;
  cell_id: string;
  category_id: string | null;
  name: string;
  emoji: string | null;
  color: string | null;
  channel_type: ChannelType;
  position: number;
  topic: string | null;
  is_read_only: boolean;
  created_by: string;
  created_at: string;
};

export type ChannelCategory = {
  id: string;
  cell_id: string;
  name: string;
  position: number;
  channels?: Channel[];
};

export type ChannelReadState = {
  user_id: string;
  channel_id: string;
  last_read_at: string;
};

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

export type MemberPreview = { avatar_url: string | null; username: string };

export type CellWithPreview = Cell & {
  member_preview: MemberPreview[];
  last_activity: string | null;
  default_channel_id?: string | null;
  last_message?: { content: string | null; message_type: string; created_at: string } | null;
  unread_count?: number;
};

// ─── Phase 12: Stories ──────────────────────────────────────────────────────

export type Story = {
  id: string;
  cell_id: string;
  created_by: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  expires_at: string;
  created_at: string;
  profiles?: { username: string; avatar_url: string | null };
};

export type CellStoryGroup = {
  cellId: string;
  cellName: string;
  cellAvatarUrl: string | null;
  cellSlug: string;
  hasUnseen: boolean;
  stories: Story[];
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
  image_url: string | null;
  channel_id: string | null;
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

export type NotificationScore = Record<string, number>; // channelId → score

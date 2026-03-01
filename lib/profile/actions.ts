'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { sendPushToUser } from '../notifications/push';
import type {
  FullProfile,
  SavedVerse,
  JoinedCell,
  PostedVideo,
  Post,
  AppNotification,
} from '../../libs/profile/types';
import {
  sendFriendRequest as _sendFriendRequest,
  acceptFriendRequest as _acceptFriendRequest,
} from '../friends/actions';

const KNOWN_CATEGORIES = [
  'Prayer',
  'Bible Study',
  'Youth',
  'Worship',
  'Discipleship',
  'General',
] as const;

// ────────────────────────────────────────────────────────────
// getFullProfile
// ────────────────────────────────────────────────────────────
export async function getFullProfile(userId?: string): Promise<FullProfile | null> {
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  if (!me) return null;

  const targetId = userId ?? me.id;
  const isSelf = targetId === me.id;

  const { data } = await supabase
    .from('profiles')
    .select(
      'id, username, avatar_url, bio, church_name, city, is_public, content_categories, deleted_at'
    )
    .eq('id', targetId)
    .is('deleted_at', null)
    .single();

  if (!data) return null;
  if (!isSelf && !data.is_public) return null;

  return data as FullProfile;
}

// ────────────────────────────────────────────────────────────
// updateProfile
// ────────────────────────────────────────────────────────────
const updateProfileSchema = z.object({
  username: z.string().min(2).max(30).trim(),
  bio: z.string().max(200).trim().optional(),
  church_name: z.string().max(100).trim().optional(),
  city: z.string().max(100).trim().optional(),
});

export async function updateProfile(
  formData: FormData
): Promise<{ error?: string; profile?: FullProfile }> {
  const raw = {
    username: formData.get('username') as string,
    bio: (formData.get('bio') as string) || undefined,
    church_name: (formData.get('church_name') as string) || undefined,
    city: (formData.get('city') as string) || undefined,
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };

  // Username uniqueness
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', parsed.data.username)
    .neq('id', user.id)
    .maybeSingle();

  if (existing) return { error: 'Username already taken' };

  const { data, error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id)
    .select(
      'id, username, avatar_url, bio, church_name, city, is_public, content_categories, deleted_at'
    )
    .single();

  if (error) return { error: error.message };
  revalidatePath('/profile');
  return { profile: data as FullProfile };
}

// ────────────────────────────────────────────────────────────
// getSavedVerses — includes note column (Phase 9)
// ────────────────────────────────────────────────────────────
export async function getSavedVerses(): Promise<SavedVerse[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('saved_verses')
    .select('verse_reference, verse_text, note, saved_at')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })
    .limit(50);

  return (data ?? []) as SavedVerse[];
}

// ────────────────────────────────────────────────────────────
// updateVerseNote — set or clear a note on a saved verse
// ────────────────────────────────────────────────────────────
export async function updateVerseNote(
  verseReference: string,
  note: string
): Promise<{ error?: string }> {
  const parsed = z.object({
    verseReference: z.string().min(1).max(100),
    note: z.string().max(2000).trim(),
  }).safeParse({ verseReference, note });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };

  const { error } = await supabase
    .from('saved_verses')
    .update({ note: parsed.data.note || null })
    .eq('user_id', user.id)
    .eq('verse_reference', parsed.data.verseReference);

  return error ? { error: error.message } : {};
}

// ────────────────────────────────────────────────────────────
// deleteSavedVerse
// ────────────────────────────────────────────────────────────
export async function deleteSavedVerse(verseReference: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };

  const { error } = await supabase
    .from('saved_verses')
    .delete()
    .eq('user_id', user.id)
    .eq('verse_reference', verseReference);

  if (error) return { error: error.message };
  revalidatePath('/profile');
  return {};
}

// ────────────────────────────────────────────────────────────
// getJoinedCells
// ────────────────────────────────────────────────────────────
export async function getJoinedCells(): Promise<JoinedCell[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('cell_members')
    .select('role, cells(id, slug, name, category, avatar_url, banner_url)')
    .eq('user_id', user.id);

  if (!data) return [];

  return (data as unknown as Array<{ role: string; cells: JoinedCell['cell'] }>).map((row) => ({
    role: row.role,
    cell: row.cells,
  }));
}

// ────────────────────────────────────────────────────────────
// getPostedVideos
// ────────────────────────────────────────────────────────────
export async function getPostedVideos(userId?: string): Promise<PostedVideo[]> {
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  if (!me) return [];

  const targetId = userId ?? me.id;

  const { data } = await supabase
    .from('videos')
    .select('id, thumbnail_url, caption, created_at, like_count')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false })
    .limit(30);

  return (data ?? []) as PostedVideo[];
}

// ────────────────────────────────────────────────────────────
// getUserPosts
// ────────────────────────────────────────────────────────────
export async function getUserPosts(userId?: string): Promise<Post[]> {
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  if (!me) return [];

  const targetId = userId ?? me.id;

  const { data } = await supabase
    .from('posts')
    .select('id, content, verse_reference, verse_text, like_count, created_at')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false })
    .limit(30);

  return (data ?? []) as Post[];
}

// ────────────────────────────────────────────────────────────
// getNotifications
// ────────────────────────────────────────────────────────────
export async function getNotifications(): Promise<AppNotification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('notifications')
    .select('id, type, payload, is_read, created_at, actor:actor_id(username, avatar_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (data ?? []) as unknown as AppNotification[];
}

// ────────────────────────────────────────────────────────────
// getUnreadCount
// ────────────────────────────────────────────────────────────
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  return count ?? 0;
}

// ────────────────────────────────────────────────────────────
// markNotificationRead
// ────────────────────────────────────────────────────────────
export async function markNotificationRead(id: string): Promise<void> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id);
}

// ────────────────────────────────────────────────────────────
// markAllNotificationsRead
// ────────────────────────────────────────────────────────────
export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);
}

// ────────────────────────────────────────────────────────────
// getBlockedUsers
// ────────────────────────────────────────────────────────────
export async function getBlockedUsers(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('blocked_users')
    .select('blocked_id')
    .eq('blocker_id', user.id);

  return (data ?? []).map((r) => r.blocked_id);
}

// ────────────────────────────────────────────────────────────
// blockUser
// ────────────────────────────────────────────────────────────
export async function blockUser(targetId: string): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(targetId);
  if (!parsed.success) return { error: 'Invalid user ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };
  if (user.id === targetId) return { error: 'Cannot block yourself' };

  const { error } = await supabase
    .from('blocked_users')
    .upsert({ blocker_id: user.id, blocked_id: targetId });

  return error ? { error: error.message } : {};
}

// ────────────────────────────────────────────────────────────
// unblockUser
// ────────────────────────────────────────────────────────────
export async function unblockUser(targetId: string): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(targetId);
  if (!parsed.success) return { error: 'Invalid user ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };

  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', targetId);

  return error ? { error: error.message } : {};
}

// ────────────────────────────────────────────────────────────
// updatePrivacy
// ────────────────────────────────────────────────────────────
export async function updatePrivacy(isPublic: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };

  const { error } = await supabase
    .from('profiles')
    .update({ is_public: isPublic })
    .eq('id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/profile');
  return {};
}

// ────────────────────────────────────────────────────────────
// updateContentPreferences
// ────────────────────────────────────────────────────────────
export async function updateContentPreferences(
  categories: string[]
): Promise<{ error?: string }> {
  const schema = z.array(z.enum(KNOWN_CATEGORIES));
  const parsed = schema.safeParse(categories);
  if (!parsed.success) return { error: 'Invalid categories' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated' };

  const { error } = await supabase
    .from('profiles')
    .update({ content_categories: parsed.data })
    .eq('id', user.id);

  return error ? { error: error.message } : {};
}

// ────────────────────────────────────────────────────────────
// changeEmail
// ────────────────────────────────────────────────────────────
export async function changeEmail(email: string): Promise<{ success?: string; error?: string }> {
  const parsed = z.string().email().safeParse(email);
  if (!parsed.success) return { error: 'Invalid email' };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: parsed.data });
  if (error) return { error: error.message };
  return { success: 'Confirmation email sent. Check your inbox.' };
}

// ────────────────────────────────────────────────────────────
// changePassword
// ────────────────────────────────────────────────────────────
export async function changePassword(
  password: string
): Promise<{ success?: string; error?: string }> {
  const parsed = z.string().min(8).safeParse(password);
  if (!parsed.success) return { error: 'Password must be at least 8 characters' };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: error.message };
  return { success: 'Password updated.' };
}

// ────────────────────────────────────────────────────────────
// notifyMention
// ────────────────────────────────────────────────────────────
export async function notifyMention(
  cellId: string,
  mentionedUserId: string,
  preview: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === mentionedUserId) return;

  // Verify mentioned user is a member of the cell
  const { data: membership } = await supabase
    .from('cell_members')
    .select('user_id')
    .eq('cell_id', cellId)
    .eq('user_id', mentionedUserId)
    .maybeSingle();

  if (!membership) return;

  await supabase.from('notifications').insert({
    user_id: mentionedUserId,
    actor_id: user.id,
    type: 'mention',
    payload: { cell_id: cellId, preview: preview.slice(0, 80) },
  });

  // Fire-and-forget push
  sendPushToUser(mentionedUserId, 'You were mentioned', preview.slice(0, 80), `/engage/${cellId}`);
}

// ────────────────────────────────────────────────────────────
// sendFriendRequest — wrapper (re-exported from friends/actions)
// ────────────────────────────────────────────────────────────
export async function sendFriendRequest(
  targetId: string
): Promise<{ error?: string }> {
  return _sendFriendRequest(targetId);
}

// ────────────────────────────────────────────────────────────
// acceptFriendRequest — wrapper (re-exported from friends/actions)
// ────────────────────────────────────────────────────────────
export async function acceptFriendRequest(
  requesterId: string
): Promise<{ error?: string }> {
  return _acceptFriendRequest(requesterId);
}

// ────────────────────────────────────────────────────────────
// deleteAccount
// ────────────────────────────────────────────────────────────
export async function deleteAccount(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  await supabase
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', user.id);

  await supabase.auth.signOut();
  redirect('/sign-in');
}

'use server';

import { createClient } from '../supabase/server';
import type { Conversation, DirectMessage } from './types';

export async function getConversations(): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('direct_messages')
    .select(`
      id,
      sender_id,
      receiver_id,
      content,
      created_at,
      read_at
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (!data || data.length === 0) return [];

  // Collect unique partner IDs
  const partnerIds = [...new Set(
    data.map((m) => m.sender_id === user.id ? m.receiver_id : m.sender_id)
  )];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', partnerIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // One conversation per partner, keyed by most recent message
  const seen = new Set<string>();
  const conversations: Conversation[] = [];

  for (const msg of data) {
    const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    if (seen.has(partnerId)) continue;
    seen.add(partnerId);

    const partner = profileMap.get(partnerId);
    if (!partner) continue;

    const unread = data.filter(
      (m) => m.sender_id === partnerId && m.receiver_id === user.id && !m.read_at
    ).length;

    conversations.push({
      id: partnerId,
      participant: { id: partner.id, username: partner.username, avatar_url: partner.avatar_url },
      last_message_preview: msg.content.slice(0, 80),
      last_message_at: msg.created_at,
      unread_count: unread,
    });
  }

  return conversations;
}

export async function getMessages(partnerId: string): Promise<DirectMessage[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('direct_messages')
    .select('id, sender_id, receiver_id, content, link_preview, created_at, read_at')
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true });

  return (data ?? []) as unknown as DirectMessage[];
}

export async function sendMessage(receiverId: string, content: string): Promise<{ id: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { id: '', error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('direct_messages')
    .insert({ sender_id: user.id, receiver_id: receiverId, content })
    .select('id')
    .single();

  if (error) return { id: '', error: error.message };
  return { id: data.id };
}

export async function markMessagesRead(partnerId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', partnerId)
    .eq('receiver_id', user.id)
    .is('read_at', null);
}

export async function getPartnerProfile(userId: string): Promise<{ id: string; username: string; avatar_url: string | null } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', userId)
    .single();
  return data ?? null;
}

// ---------------------------------------------------------------------------
// getOrCreateConversation — ensures a conversations row exists for the pair
// Uses the conversations table from newdb/07_chat.sql.
// Run 07_chat.sql in Supabase SQL Editor before using.
// ---------------------------------------------------------------------------
export async function getOrCreateConversation(
  partnerId: string
): Promise<{ conversationId: string | null; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { conversationId: null, error: 'Not authenticated' };
  if (user.id === partnerId) return { conversationId: null, error: 'Cannot message yourself' };

  // Canonical pair ordering prevents (A,B)/(B,A) duplicates
  const a = user.id < partnerId ? user.id : partnerId;
  const b = user.id < partnerId ? partnerId : user.id;

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_a', a)
    .eq('participant_b', b)
    .maybeSingle();

  if (existing) return { conversationId: (existing as { id: string }).id };

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ participant_a: a, participant_b: b })
    .select('id')
    .single();

  if (error) return { conversationId: null, error: error.message };
  return { conversationId: (created as { id: string }).id };
}

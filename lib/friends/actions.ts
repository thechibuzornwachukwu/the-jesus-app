'use server';

import { createClient } from '../supabase/server';

export async function sendFriendRequest(
  targetId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase.from('friend_requests').insert({
    requester_id: user.id,
    target_id: targetId,
    status: 'pending',
  });

  if (error) return { error: error.message };
  return {};
}

export async function acceptFriendRequest(
  requesterId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('requester_id', requesterId)
    .eq('target_id', user.id);

  if (error) return { error: error.message };
  return {};
}

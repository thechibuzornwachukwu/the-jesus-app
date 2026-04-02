'use server';

import { createClient } from '../supabase/server';

export type StreakEventType =
  | 'verse_save'
  | 'verse_save_with_note'
  | 'post'
  | 'image_post'
  | 'comment'
  | 'chat_message'
  | 'course_complete';

// ---------------------------------------------------------------------------
// logDailyEngagement — calls update_streak RPC (defined in 10_functions.sql)
// Run newdb/05_streaks.sql + newdb/10_functions.sql before using.
// ---------------------------------------------------------------------------
export async function logDailyEngagement(userId: string): Promise<void> {
  if (!userId) return;
  const supabase = await createClient();
  await supabase.rpc('update_streak', { _user_id: userId });
}

// ---------------------------------------------------------------------------
// logStreakEvent — calls update_streak for the currently signed-in user
// ---------------------------------------------------------------------------
export async function logStreakEvent(_event: StreakEventType): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc('update_streak', { _user_id: user.id });
}

// ---------------------------------------------------------------------------
// getStreakData — reads from streaks table (newdb/05_streaks.sql)
// ---------------------------------------------------------------------------
export async function getStreakData(): Promise<{ current: number; longest: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { current: 0, longest: 0 };

  const { data } = await supabase
    .from('streaks')
    .select('current, longest')
    .eq('user_id', user.id)
    .single();

  return {
    current: (data as { current?: number } | null)?.current ?? 0,
    longest: (data as { longest?: number } | null)?.longest ?? 0,
  };
}

'use server';

import { createClient } from '../supabase/server';
import type { CourseProgress } from '../../libs/learn/types';
import { logStreakEvent } from '../streaks/actions';

// ─── Course Progress ─────────────────────────────────────────────────────────

export async function getCourseProgress(): Promise<CourseProgress[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('course_progress')
    .select('track_id, lesson_idx, completed')
    .eq('user_id', user.id);

  return (data ?? []) as CourseProgress[];
}

export async function upsertCourseProgress(
  trackId: string,
  lessonIdx: number,
  completed: boolean
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('course_progress').upsert(
    {
      user_id: user.id,
      track_id: trackId,
      lesson_idx: lessonIdx,
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,track_id' }
  );

  if (completed) void logStreakEvent('course_complete');
}

// ─── Conversation History ─────────────────────────────────────────────────────

export async function getConversationHistory(
  sessionId: string
): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('spiritual_conversations')
    .select('role, content')
    .eq('user_id', user.id)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(40);

  return (data ?? []) as { role: 'user' | 'assistant'; content: string }[];
}

'use server';

import { createClient } from '../supabase/server';
import type { CourseProgress } from '../../libs/learn/types';

export async function getCourseProgress(): Promise<CourseProgress[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('course_progress')
    .select('track_id, lesson_index, completed, completed_at')
    .eq('user_id', user.id);

  return (data ?? []) as CourseProgress[];
}

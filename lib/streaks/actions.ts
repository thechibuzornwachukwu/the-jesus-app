'use server';

import { createClient } from '../supabase/server';

export type StreakEventType =
  | 'verse_save'
  | 'verse_save_with_note'
  | 'post_content'
  | 'cell_message'
  | 'course_complete';

export type UserStreak = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_points: number;
  last_active_date: string | null;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon_code: string;
  criteria_type: string;
  criteria_value: number;
};

export type UserBadge = {
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge: Badge;
};

const POINT_VALUES: Record<StreakEventType, number> = {
  verse_save: 10,
  verse_save_with_note: 20,
  post_content: 15,
  cell_message: 5,
  course_complete: 50,
};

// ────────────────────────────────────────────────────────────
// getStreak  fetch the current user's streak row
// ────────────────────────────────────────────────────────────
export async function getStreak(userId?: string): Promise<UserStreak | null> {
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  if (!me) return null;

  const targetId = userId ?? me.id;

  const { data } = await supabase
    .from('user_streaks')
    .select('user_id, current_streak, longest_streak, total_points, last_active_date')
    .eq('user_id', targetId)
    .maybeSingle();

  if (!data) {
    return {
      user_id: targetId,
      current_streak: 0,
      longest_streak: 0,
      total_points: 0,
      last_active_date: null,
    };
  }

  return data as UserStreak;
}

// ────────────────────────────────────────────────────────────
// logStreakEvent  insert event, update user_streaks
// ────────────────────────────────────────────────────────────
export async function logStreakEvent(
  eventType: StreakEventType
): Promise<{ points: number; streak: UserStreak; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { points: 0, streak: { user_id: '', current_streak: 0, longest_streak: 0, total_points: 0, last_active_date: null }, error: 'Unauthenticated' };

  const points = POINT_VALUES[eventType] ?? 0;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Insert the event
  await supabase
    .from('streak_events')
    .insert({ user_id: user.id, event_type: eventType, points });

  // Fetch current streak row
  const { data: current } = await supabase
    .from('user_streaks')
    .select('user_id, current_streak, longest_streak, total_points, last_active_date')
    .eq('user_id', user.id)
    .maybeSingle();

  let newStreak = 1;
  let longestStreak = 1;
  let totalPoints = points;

  if (current) {
    const lastDate = current.last_active_date as string | null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (lastDate === today) {
      // Already logged today  don't increment streak, just add points
      newStreak = current.current_streak;
    } else if (lastDate === yesterdayStr) {
      // Consecutive day
      newStreak = current.current_streak + 1;
    } else {
      // Streak broken
      newStreak = 1;
    }

    longestStreak = Math.max(current.longest_streak, newStreak);
    totalPoints = current.total_points + points;
  }

  const { data: updated } = await supabase
    .from('user_streaks')
    .upsert({
      user_id: user.id,
      current_streak: newStreak,
      longest_streak: longestStreak,
      total_points: totalPoints,
      last_active_date: today,
    })
    .select('user_id, current_streak, longest_streak, total_points, last_active_date')
    .single();

  const streak = (updated as UserStreak | null) ?? {
    user_id: user.id,
    current_streak: newStreak,
    longest_streak: longestStreak,
    total_points: totalPoints,
    last_active_date: today,
  };

  // Check for newly earned badges
  await awardBadgeIfEarned(user.id, 'streak_days', newStreak);
  await awardBadgeIfEarned(user.id, 'verse_save', totalPoints);

  return { points, streak };
}

// ────────────────────────────────────────────────────────────
// awardBadgeIfEarned  check & grant badge by criteria
// ────────────────────────────────────────────────────────────
export async function awardBadgeIfEarned(
  userId: string,
  criteriaType: string,
  count: number
): Promise<void> {
  const supabase = await createClient();

  // Find matching badges where threshold is met
  const { data: eligible } = await supabase
    .from('badges')
    .select('id, criteria_value')
    .eq('criteria_type', criteriaType)
    .lte('criteria_value', count);

  if (!eligible || eligible.length === 0) return;

  const badgeIds = eligible.map((b) => b.id);

  // Filter out already-awarded badges
  const { data: already } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId)
    .in('badge_id', badgeIds);

  const alreadySet = new Set((already ?? []).map((r) => r.badge_id));
  const toInsert = badgeIds.filter((id) => !alreadySet.has(id));

  if (toInsert.length === 0) return;

  await supabase.from('user_badges').insert(
    toInsert.map((badge_id) => ({ user_id: userId, badge_id }))
  );
}

// ────────────────────────────────────────────────────────────
// getBadges  user_badges joined with badges
// ────────────────────────────────────────────────────────────
export async function getBadges(userId?: string): Promise<UserBadge[]> {
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  if (!me) return [];

  const targetId = userId ?? me.id;

  const { data } = await supabase
    .from('user_badges')
    .select('user_id, badge_id, awarded_at, badge:badges(id, name, description, icon_code, criteria_type, criteria_value)')
    .eq('user_id', targetId)
    .order('awarded_at', { ascending: false });

  return (data ?? []) as unknown as UserBadge[];
}

// ────────────────────────────────────────────────────────────
// getAllBadges  full catalog (for display)
// ────────────────────────────────────────────────────────────
export async function getAllBadges(): Promise<Badge[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('badges')
    .select('id, name, description, icon_code, criteria_type, criteria_value')
    .order('criteria_value', { ascending: true });

  return (data ?? []) as Badge[];
}

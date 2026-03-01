import type { SupabaseClient } from '@supabase/supabase-js';
import { sendPushToUser } from '../notifications/push';

/**
 * Check all badge criteria for a user and award any newly earned badges.
 * Accepts a supabase client so it works in both user-auth and service-role contexts.
 */
export async function checkAndAwardBadges(
  userId: string,
  supabase: SupabaseClient
): Promise<void> {
  const { data: allBadges } = await supabase
    .from('badges')
    .select('id, name, description, criteria_type, criteria_value');

  if (!allBadges?.length) return;

  const { data: existingBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earned = new Set((existingBadges ?? []).map((b: { badge_id: string }) => b.badge_id));
  const unearned = allBadges.filter((b: { id: string }) => !earned.has(b.id));
  if (!unearned.length) return;

  const criteriaTypes = [...new Set(unearned.map((b: { criteria_type: string }) => b.criteria_type))];
  const counts = await getCriteriaCounts(userId, criteriaTypes, supabase);

  const toAward: typeof unearned = [];
  for (const badge of unearned) {
    const count = counts[badge.criteria_type] ?? 0;
    if (count >= badge.criteria_value) toAward.push(badge);
  }

  if (!toAward.length) return;

  await supabase.from('user_badges').insert(
    toAward.map((b: { id: string }) => ({ user_id: userId, badge_id: b.id }))
  );

  // Notify in-app + push for each new badge
  await Promise.all(
    toAward.map(async (badge: { id: string; name: string; description: string }) => {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'badge_earned',
        payload: { badge_id: badge.id, badge_name: badge.name },
      });
      void sendPushToUser(
        userId,
        `You earned the ${badge.name} badge!`,
        badge.description ?? '',
        '/profile'
      );
    })
  );
}

async function getCriteriaCounts(
  userId: string,
  types: string[],
  supabase: SupabaseClient
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  await Promise.all(
    types.map(async (type) => {
      switch (type) {
        case 'verse_save': {
          const { count } = await supabase
            .from('saved_verses')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          counts.verse_save = count ?? 0;
          break;
        }
        case 'post_count': {
          const [{ count: vc }, { count: pc }] = await Promise.all([
            supabase.from('videos').select('*', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          ]);
          counts.post_count = (vc ?? 0) + (pc ?? 0);
          break;
        }
        case 'cell_join': {
          const { count } = await supabase
            .from('cell_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          counts.cell_join = count ?? 0;
          break;
        }
        case 'course_complete': {
          const { count } = await supabase
            .from('course_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', true);
          counts.course_complete = count ?? 0;
          break;
        }
        case 'streak_days': {
          const { data } = await supabase
            .from('user_streaks')
            .select('current_streak')
            .eq('user_id', userId)
            .maybeSingle();
          counts.streak_days = (data as { current_streak: number } | null)?.current_streak ?? 0;
          break;
        }
        case 'friend_count': {
          const { count } = await supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'accepted')
            .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
          counts.friend_count = count ?? 0;
          break;
        }
        case 'first_action': {
          const { count } = await supabase
            .from('streak_events')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .limit(1);
          counts.first_action = (count ?? 0) > 0 ? 1 : 0;
          break;
        }
      }
    })
  );

  return counts;
}

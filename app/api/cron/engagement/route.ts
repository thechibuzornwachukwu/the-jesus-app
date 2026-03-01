import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDailyVerse } from '../../../../lib/explore/daily-verses';
import { sendPushToUser } from '../../../../lib/notifications/push';
import { checkAndAwardBadges } from '../../../../lib/gamification/check-badges';

export const runtime = 'nodejs';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getAdmin();
  const now = new Date();
  const utcHour = now.getUTCHours();

  // Batch: up to 50 users with push subscriptions
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id')
    .limit(50);

  if (!subs?.length) return NextResponse.json({ ok: true, users: 0 });

  const userIds = [...new Set(subs.map((s: { user_id: string }) => s.user_id))];

  await Promise.allSettled(
    userIds.map((userId) => notifyUser(userId, supabase, utcHour, now))
  );

  return NextResponse.json({ ok: true, users: userIds.length });
}

async function notifyUser(
  userId: string,
  supabase: ReturnType<typeof createClient>,
  utcHour: number,
  now: Date
) {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const oneHourAgo = new Date(now.getTime() - 3_600_000).toISOString();

  // ── 1. Unread cell messages ─────────────────────────────────────────────────
  const { data: memberships } = await supabase
    .from('cell_members')
    .select('cell_id, cells(name)')
    .eq('user_id', userId)
    .limit(10);

  if (memberships?.length) {
    const cellIds = memberships.map((m: { cell_id: string }) => m.cell_id);

    const { data: channels } = await supabase
      .from('channels')
      .select('id, cell_id')
      .in('cell_id', cellIds);

    const channelIds = (channels ?? []).map((c: { id: string }) => c.id);

    if (channelIds.length) {
      const { data: readStates } = await supabase
        .from('channel_read_states')
        .select('channel_id, last_read_at')
        .eq('user_id', userId)
        .in('channel_id', channelIds);

      const readMap = new Map(
        (readStates ?? []).map((r: { channel_id: string; last_read_at: string }) => [
          r.channel_id,
          r.last_read_at,
        ])
      );

      let totalUnread = 0;
      let topCell: string | null = null;

      await Promise.all(
        channelIds.map(async (chId: string) => {
          const lastRead = readMap.get(chId);
          let q = supabase
            .from('chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('channel_id', chId)
            .neq('user_id', userId);
          if (lastRead) q = q.gt('created_at', lastRead);
          const { count } = await q;
          if (count && count > 0) {
            totalUnread += count;
            if (!topCell) {
              const ch = (channels ?? []).find((c: { id: string }) => c.id === chId);
              const mem = memberships.find(
                (m: { cell_id: string }) => m.cell_id === ch?.cell_id
              );
              topCell = (mem as unknown as { cells: { name: string } } | null)?.cells?.name ?? null;
            }
          }
        })
      );

      if (totalUnread > 0 && topCell) {
        void sendPushToUser(
          userId,
          'Unread messages',
          `You have ${totalUnread} unread message${totalUnread > 1 ? 's' : ''} in ${topCell}`,
          '/engage'
        );
      }
    }
  }

  // ── 2. New posts from friends ───────────────────────────────────────────────
  const { data: friends } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .limit(50);

  if (friends?.length) {
    const friendIds = friends.map((f: { requester_id: string; addressee_id: string }) =>
      f.requester_id === userId ? f.addressee_id : f.requester_id
    );

    const { data: newPosts } = await supabase
      .from('posts')
      .select('user_id, profiles(username)')
      .in('user_id', friendIds)
      .gt('created_at', oneHourAgo)
      .limit(1)
      .maybeSingle();

    if (newPosts) {
      const username =
        (newPosts as unknown as { profiles: { username: string } }).profiles?.username ??
        'A friend';
      void sendPushToUser(
        userId,
        'New perspective',
        `${username} shared a new perspective`,
        '/explore'
      );
    }
  }

  // ── 3. Streak at risk ───────────────────────────────────────────────────────
  const { data: streak } = await supabase
    .from('user_streaks')
    .select('current_streak, last_active_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (
    streak &&
    (streak as { current_streak: number; last_active_date: string | null }).last_active_date ===
      yesterdayStr &&
    (streak as { current_streak: number }).current_streak > 1
  ) {
    void sendPushToUser(
      userId,
      "Don't break your streak!",
      `Keep your ${(streak as { current_streak: number }).current_streak}-day streak alive — open the app now`,
      '/'
    );
  }

  // ── 4. New badge earned recently ────────────────────────────────────────────
  const { data: recentBadges } = await supabase
    .from('user_badges')
    .select('badge_id, badges(name, description), awarded_at')
    .eq('user_id', userId)
    .gt('awarded_at', oneHourAgo)
    .limit(3);

  for (const ub of recentBadges ?? []) {
    const b = (ub as unknown as { badges: { name: string; description: string } }).badges;
    if (b) {
      void sendPushToUser(userId, `You earned the ${b.name} badge!`, b.description ?? '', '/profile');
    }
  }

  // ── 5. Daily verse at 9am UTC ──────────────────────────────────────────────
  if (utcHour === 9) {
    const verse = getDailyVerse();
    void sendPushToUser(userId, "Today's verse", verse.reference, '/explore');
  }

  // ── 6. Check & award any new badges ────────────────────────────────────────
  await checkAndAwardBadges(userId, supabase);
}

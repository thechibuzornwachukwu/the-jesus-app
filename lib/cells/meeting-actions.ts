'use server';

import { createClient } from '../supabase/server';

export type ScheduledMeeting = {
  id: string;
  cell_id: string;
  channel_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_min: number;
  created_by: string;
  notified_at: string | null;
  cancelled_at: string | null;
  created_at: string;
};

export type MeetingRsvp = {
  meeting_id: string;
  user_id: string;
  response: 'yes' | 'no' | 'maybe';
  updated_at: string;
  profiles?: { username: string; avatar_url: string | null } | null;
};

export type MeetingWithRsvps = {
  meeting: ScheduledMeeting;
  rsvps: MeetingRsvp[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>, cellId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { data } = await supabase
    .from('cell_members')
    .select('role')
    .eq('cell_id', cellId)
    .eq('user_id', user.id)
    .single();

  if (!data || data.role !== 'admin') throw new Error('Forbidden');
  return user.id;
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function createMeeting(
  channelId: string,
  data: {
    cellId: string;
    title: string;
    scheduledAt: string;   // ISO string
    durationMin: number;
    description?: string;
  }
): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = await createClient();
    const userId = await assertAdmin(supabase, data.cellId);

    // Verify channel belongs to cell and is meeting type
    const { data: channel } = await supabase
      .from('channels')
      .select('id, channel_type, cell_id')
      .eq('id', channelId)
      .single();

    if (!channel || channel.cell_id !== data.cellId || channel.channel_type !== 'meeting') {
      return { error: 'Invalid meeting channel' };
    }

    const { data: meeting, error } = await supabase
      .from('scheduled_meetings')
      .insert({
        cell_id: data.cellId,
        channel_id: channelId,
        title: data.title,
        description: data.description ?? null,
        scheduled_at: data.scheduledAt,
        duration_min: data.durationMin,
        created_by: userId,
      })
      .select('id')
      .single();

    if (error || !meeting) return { error: error?.message ?? 'Failed to create meeting' };
    return { id: meeting.id };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

export async function updateMeeting(
  meetingId: string,
  data: {
    cellId: string;
    title?: string;
    scheduledAt?: string;
    durationMin?: number;
    description?: string;
  }
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await createClient();
    await assertAdmin(supabase, data.cellId);

    // If time changed significantly AND already notified, reset notified_at so it fires again
    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.durationMin !== undefined) updates.duration_min = data.durationMin;

    if (data.scheduledAt !== undefined) {
      updates.scheduled_at = data.scheduledAt;

      // Check if we need to re-notify (time shift > 15 min)
      const { data: existing } = await supabase
        .from('scheduled_meetings')
        .select('scheduled_at, notified_at')
        .eq('id', meetingId)
        .single();

      if (existing?.notified_at) {
        const diff = Math.abs(
          new Date(data.scheduledAt).getTime() - new Date(existing.scheduled_at).getTime()
        );
        if (diff > 15 * 60 * 1000) updates.notified_at = null;
      }
    }

    const { error } = await supabase
      .from('scheduled_meetings')
      .update(updates)
      .eq('id', meetingId);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

export async function cancelMeeting(
  meetingId: string,
  cellId: string
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await createClient();
    await assertAdmin(supabase, cellId);

    const { error } = await supabase
      .from('scheduled_meetings')
      .update({ cancelled_at: new Date().toISOString() })
      .eq('id', meetingId);

    if (error) return { error: error.message };

    // Fire cancellation push via the API route (non-blocking)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    fetch(`${baseUrl}/api/cells/notify-meeting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId, type: 'cancel' }),
    }).catch(() => {});

    return { ok: true };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

export async function upsertRsvp(
  meetingId: string,
  response: 'yes' | 'no' | 'maybe'
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthenticated' };

    const { error } = await supabase
      .from('meeting_rsvps')
      .upsert(
        { meeting_id: meetingId, user_id: user.id, response, updated_at: new Date().toISOString() },
        { onConflict: 'meeting_id,user_id' }
      );

    if (error) return { error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

/** Returns active (non-cancelled) upcoming meetings for a cell.
 *  "Upcoming" = scheduled_at > now() - 1hr (so in-progress meetings still show). */
export async function getUpcomingMeetings(cellId: string): Promise<ScheduledMeeting[]> {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('scheduled_meetings')
    .select('*')
    .eq('cell_id', cellId)
    .is('cancelled_at', null)
    .gte('scheduled_at', cutoff)
    .order('scheduled_at', { ascending: true });

  return (data ?? []) as ScheduledMeeting[];
}

export async function getMeetingWithRsvps(meetingId: string): Promise<MeetingWithRsvps | null> {
  const supabase = await createClient();

  const [{ data: meeting }, { data: rsvps }] = await Promise.all([
    supabase.from('scheduled_meetings').select('*').eq('id', meetingId).single(),
    supabase
      .from('meeting_rsvps')
      .select('*, profiles(username, avatar_url)')
      .eq('meeting_id', meetingId),
  ]);

  if (!meeting) return null;
  return {
    meeting: meeting as ScheduledMeeting,
    rsvps: (rsvps ?? []) as unknown as MeetingRsvp[],
  };
}

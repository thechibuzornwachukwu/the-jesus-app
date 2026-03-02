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
  provider: 'jitsi' | 'custom';
  meeting_url: string;
  room_code: string | null;
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

function slugifyRoomFragment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeRoomCode(roomCode: string | undefined): string | null {
  if (!roomCode) return null;
  const trimmed = roomCode.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 80);
  return normalized.length >= 4 ? normalized : null;
}

function buildDefaultRoomCode(cellId: string, channelId: string, title: string, scheduledAt: string): string {
  const date = new Date(scheduledAt);
  const d = Number.isNaN(date.getTime())
    ? 'meeting'
    : `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
  const titlePart = slugifyRoomFragment(title).slice(0, 20) || 'meeting';
  return `jesusapp-${cellId.slice(0, 6)}-${channelId.slice(0, 6)}-${titlePart}-${d}`.slice(0, 80);
}

function buildJitsiUrl(roomCode: string): string {
  return `https://meet.jit.si/${encodeURIComponent(roomCode)}`;
}

function normalizeMeetingLink(input: {
  cellId: string;
  channelId: string;
  title: string;
  scheduledAt: string;
  provider?: 'jitsi' | 'custom';
  meetingUrl?: string;
  roomCode?: string;
}): { provider: 'jitsi' | 'custom'; meeting_url: string; room_code: string | null } {
  const provider = input.provider ?? 'jitsi';

  if (provider === 'custom') {
    const raw = (input.meetingUrl ?? '').trim();
    if (!raw) throw new Error('Custom meeting URL is required');
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('Custom meeting URL must start with http:// or https://');
      }
      return { provider: 'custom', meeting_url: parsed.toString(), room_code: null };
    } catch {
      throw new Error('Invalid custom meeting URL');
    }
  }

  const roomCode =
    normalizeRoomCode(input.roomCode) ??
    buildDefaultRoomCode(input.cellId, input.channelId, input.title, input.scheduledAt);
  return {
    provider: 'jitsi',
    meeting_url: buildJitsiUrl(roomCode),
    room_code: roomCode,
  };
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
    provider?: 'jitsi' | 'custom';
    meetingUrl?: string;
    roomCode?: string;
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

    const meetingLink = normalizeMeetingLink({
      cellId: data.cellId,
      channelId,
      title: data.title,
      scheduledAt: data.scheduledAt,
      provider: data.provider,
      meetingUrl: data.meetingUrl,
      roomCode: data.roomCode,
    });

    const { data: meeting, error } = await supabase
      .from('scheduled_meetings')
      .insert({
        cell_id: data.cellId,
        channel_id: channelId,
        title: data.title,
        description: data.description ?? null,
        scheduled_at: data.scheduledAt,
        duration_min: data.durationMin,
        provider: meetingLink.provider,
        meeting_url: meetingLink.meeting_url,
        room_code: meetingLink.room_code,
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
    provider?: 'jitsi' | 'custom';
    meetingUrl?: string;
    roomCode?: string;
  }
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await createClient();
    await assertAdmin(supabase, data.cellId);

    const { data: existing } = await supabase
      .from('scheduled_meetings')
      .select('id, cell_id, channel_id, title, scheduled_at, duration_min, provider, meeting_url, room_code, notified_at')
      .eq('id', meetingId)
      .single();

    if (!existing || existing.cell_id !== data.cellId) return { error: 'Meeting not found' };

    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.durationMin !== undefined) updates.duration_min = data.durationMin;

    if (data.scheduledAt !== undefined) {
      updates.scheduled_at = data.scheduledAt;
      if (existing.notified_at) {
        const diff = Math.abs(
          new Date(data.scheduledAt).getTime() - new Date(existing.scheduled_at).getTime()
        );
        if (diff > 15 * 60 * 1000) updates.notified_at = null;
      }
    }

    const shouldRecomputeLink =
      data.provider !== undefined ||
      data.meetingUrl !== undefined ||
      data.roomCode !== undefined ||
      (data.scheduledAt !== undefined && (data.provider ?? existing.provider) === 'jitsi') ||
      (data.title !== undefined && (data.provider ?? existing.provider) === 'jitsi');

    if (shouldRecomputeLink) {
      const link = normalizeMeetingLink({
        cellId: existing.cell_id,
        channelId: existing.channel_id,
        title: data.title ?? existing.title,
        scheduledAt: data.scheduledAt ?? existing.scheduled_at,
        provider: data.provider ?? existing.provider,
        meetingUrl: data.meetingUrl ?? existing.meeting_url,
        roomCode: data.roomCode ?? existing.room_code ?? undefined,
      });
      updates.provider = link.provider;
      updates.meeting_url = link.meeting_url;
      updates.room_code = link.room_code;
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

    const { data: existing } = await supabase
      .from('scheduled_meetings')
      .select('id, cell_id')
      .eq('id', meetingId)
      .single();
    if (!existing || existing.cell_id !== cellId) return { error: 'Meeting not found' };

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

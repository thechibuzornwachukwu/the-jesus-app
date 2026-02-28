import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToUser } from '../../../../lib/notifications/push';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { meetingId, type = 'reminder' } = await req.json() as {
      meetingId: string;
      type?: 'reminder' | 'cancel';
    };

    if (!meetingId) {
      return NextResponse.json({ error: 'meetingId required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Fetch meeting + cell slug
    const { data: meeting } = await supabase
      .from('scheduled_meetings')
      .select('id, title, channel_id, cell_id, scheduled_at, cancelled_at, notified_at, cells(slug)')
      .eq('id', meetingId)
      .single();

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // For reminders, skip if already notified or cancelled
    if (type === 'reminder' && (meeting.cancelled_at || meeting.notified_at)) {
      return NextResponse.json({ skipped: true });
    }

    // Fetch all cell members
    const { data: members } = await supabase
      .from('cell_members')
      .select('user_id')
      .eq('cell_id', meeting.cell_id);

    if (!members || members.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const cellSlug = (meeting.cells as { slug?: string } | null)?.slug ?? meeting.cell_id;
    const url = `/engage/${cellSlug}/${meeting.channel_id}`;

    const title = type === 'cancel'
      ? `Meeting cancelled: ${meeting.title}`
      : `Meeting: ${meeting.title}`;

    const body = type === 'cancel'
      ? 'This meeting has been cancelled.'
      : 'Starts in 1 hour';

    // Send push to all members in parallel (fire-and-forget per user)
    await Promise.allSettled(
      members.map((m) => sendPushToUser(m.user_id, title, body, url))
    );

    // Mark as notified (only for reminder, not cancel)
    if (type === 'reminder') {
      await supabase
        .from('scheduled_meetings')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', meetingId);
    }

    return NextResponse.json({ sent: members.length });
  } catch (err: unknown) {
    console.error('[notify-meeting]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

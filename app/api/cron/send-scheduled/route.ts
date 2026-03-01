import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service-role client  bypasses RLS so the cron can insert on behalf of users
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();

  // Fetch all unsent messages whose send_at has passed
  const { data: due, error: fetchError } = await supabase
    .from('scheduled_messages')
    .select('*')
    .eq('sent', false)
    .lte('send_at', new Date().toISOString())
    .order('send_at', { ascending: true })
    .limit(100);

  if (fetchError) {
    console.error('[cron:send-scheduled] fetch error', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!due || due.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const msg of due) {
    // Insert into chat_messages
    const { error: insertError } = await supabase.from('chat_messages').insert({
      cell_id: msg.cell_id,
      user_id: msg.user_id,
      content: msg.content,
      message_type: msg.message_type,
      audio_url: msg.audio_url ?? null,
    });

    if (insertError) {
      errors.push(`${msg.id}: ${insertError.message}`);
      continue;
    }

    // Mark as sent
    await supabase
      .from('scheduled_messages')
      .update({ sent: true })
      .eq('id', msg.id);

    sent++;
  }

  if (errors.length > 0) {
    console.error('[cron:send-scheduled] partial errors', errors);
  }

  return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined });
}

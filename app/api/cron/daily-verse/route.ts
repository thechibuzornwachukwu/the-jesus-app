import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDailyVerse } from '@/lib/explore/daily-verses';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getWebPush() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const wp = require('web-push');
  wp.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return wp;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const verse = getDailyVerse();

  // Fetch all active push subscriptions
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const wp = getWebPush();
  const payload = JSON.stringify({
    title: `📖 ${verse.reference}`,
    body: verse.text.length > 100 ? verse.text.slice(0, 97) + '…' : verse.text,
    url: '/explore',
  });

  let sent = 0;
  const stale: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await wp.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) stale.push(sub.id);
      }
    })
  );

  // Clean up stale subscriptions
  if (stale.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', stale);
  }

  return NextResponse.json({ sent, staleRemoved: stale.length });
}

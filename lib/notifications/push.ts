import { createClient } from '@supabase/supabase-js';

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

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url = '/'
): Promise<void> {
  try {
    const supabase = getServiceClient();
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth_key')
      .eq('user_id', userId);

    if (!subs || subs.length === 0) return;

    const wp = getWebPush();
    const payload = JSON.stringify({ title, body, url });

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await wp.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
            payload
          );
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 410 || status === 404) {
            // Stale subscription  remove it
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      })
    );
  } catch {
    // Fire-and-forget  swallow errors
  }
}

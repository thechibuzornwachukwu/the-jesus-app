/**
 * Manual push-notification smoke test.
 * Usage: npx tsx scripts/test-push.ts <userId>
 *
 * Requires in .env.local:
 *   VAPID_EMAIL, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
 *   SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
 */
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import { sendPushToUser } from '../lib/notifications/push';

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: npx tsx scripts/test-push.ts <userId>');
  process.exit(1);
}

const required = [
  'VAPID_EMAIL',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('Missing env vars:', missing.join(', '));
  process.exit(1);
}

console.log(`Sending test push to user ${userId}…`);
await sendPushToUser(
  userId,
  'Test Notification',
  'If you see this, push delivery is working.',
  '/engage'
);
console.log('Done — check browser and server logs for errors.');

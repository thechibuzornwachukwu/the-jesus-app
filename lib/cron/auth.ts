import { NextRequest } from 'next/server';

/**
 * Guards cron routes by verifying the CRON_SECRET header or query param.
 * Vercel sets the Authorization header as "Bearer <CRON_SECRET>" for cron jobs.
 */
export function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  // Vercel cron: Authorization: Bearer <secret>
  const authHeader = req.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;

  // Fallback: ?secret=<secret> query param
  const querySecret = req.nextUrl.searchParams.get('secret');
  if (querySecret === secret) return true;

  return false;
}

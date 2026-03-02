import type { NextRequest } from 'next/server';

export function isCronAuthorized(req: NextRequest | Request): boolean {
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

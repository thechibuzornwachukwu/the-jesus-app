import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized } from '../../../../lib/cron/auth';
import { GET as runEngagement } from '../engagement/route';
import { GET as runPurgeExpired } from '../purge-expired/route';
import { GET as runDailyVerse } from '../daily-verse/route';

type JobName =
  | 'engagement'
  | 'purge-expired'
  | 'daily-verse';

const ALL_JOBS: JobName[] = [
  'engagement',
  'purge-expired',
  'daily-verse',
];

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobsParam = req.nextUrl.searchParams.get('jobs');
  const selected: JobName[] = jobsParam
    ? jobsParam
        .split(',')
        .map((j) => j.trim())
        .filter((j): j is JobName => ALL_JOBS.includes(j as JobName))
    : ALL_JOBS;

  const results: Record<string, unknown> = {};

  for (const job of selected) {
    try {
      const response =
        job === 'engagement'
          ? await runEngagement(req)
          : job === 'purge-expired'
          ? await runPurgeExpired(req)
          : await runDailyVerse(req);

      const body = await response.json().catch(() => ({}));
      results[job] = {
        ok: response.ok,
        status: response.status,
        body,
      };
    } catch (error) {
      results[job] = {
        ok: false,
        status: 500,
        body: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  const failed = Object.values(results).some(
    (r) => typeof r === 'object' && r !== null && 'ok' in r && (r as { ok: boolean }).ok === false
  );

  return NextResponse.json(
    {
      ok: !failed,
      ran: selected,
      results,
    },
    { status: failed ? 207 : 200 }
  );
}

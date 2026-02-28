import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const now = new Date().toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400 * 1000).toISOString();

  const results: Record<string, number | string> = {};

  // 1. Expired invite links
  const { count: invites } = await supabase
    .from('cell_invites')
    .delete()
    .lt('expires_at', now)
    .not('expires_at', 'is', null)
    .select('*', { count: 'exact', head: true });
  results.expiredInvites = invites ?? 0;

  // 2. Soft-deleted profiles older than 30 days
  const { count: profiles } = await supabase
    .from('profiles')
    .delete()
    .lt('deleted_at', thirtyDaysAgo)
    .not('deleted_at', 'is', null)
    .select('*', { count: 'exact', head: true });
  results.deletedProfiles = profiles ?? 0;

  // 3. Old AI spiritual conversations (90+ days)
  const { count: convos } = await supabase
    .from('spiritual_conversations')
    .delete()
    .lt('created_at', ninetyDaysAgo)
    .select('*', { count: 'exact', head: true });
  results.oldConversations = convos ?? 0;

  return NextResponse.json({ purged: results });
}

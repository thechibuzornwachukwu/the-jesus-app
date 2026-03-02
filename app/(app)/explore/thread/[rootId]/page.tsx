import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '../../../../../lib/supabase/server';
import { getThread } from '../../../../../lib/explore/actions';
import { ThreadView } from '../../../../../libs/explore/ThreadView';

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ rootId: string }>;
}) {
  const { rootId } = await params;
  if (!z.string().uuid().safeParse(rootId).success) notFound();

  const supabase = await createClient();
  const [{ data: authData }, thread] = await Promise.all([
    supabase.auth.getUser(),
    getThread(rootId),
  ]);

  const user = authData.user;
  if (!user) redirect('/sign-in');
  if (!thread) notFound();

  return <ThreadView root={thread.root} replies={thread.replies} userId={user.id} />;
}

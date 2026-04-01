import { redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { NotificationsPageClient } from './NotificationsPageClient';

interface Props {
  params: Promise<{ username: string }>;
}

export const metadata = { title: 'Notifications · The JESUS App' };

export default async function NotificationsPage({ params }: Props) {
  const { username } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: myRow } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (myRow?.username !== username) redirect(`/profile/${username}`);

  return <NotificationsPageClient />;
}

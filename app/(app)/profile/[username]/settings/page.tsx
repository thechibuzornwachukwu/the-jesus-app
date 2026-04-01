import { redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { getFullProfile, getBlockedUsers } from '../../../../../lib/profile/actions';
import { SettingsPageClient } from './SettingsPageClient';

interface Props {
  params: Promise<{ username: string }>;
}

export const metadata = { title: 'Settings · The JESUS App' };

export default async function SettingsPage({ params }: Props) {
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

  const [profile, blockedUserIds] = await Promise.all([
    getFullProfile(),
    getBlockedUsers(),
  ]);

  if (!profile) redirect('/sign-in');

  return <SettingsPageClient profile={profile} blockedUserIds={blockedUserIds} />;
}

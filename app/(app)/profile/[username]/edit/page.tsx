import { redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { getFullProfile } from '../../../../../lib/profile/actions';
import { EditProfileClient } from './EditProfileClient';

interface Props {
  params: Promise<{ username: string }>;
}

export const metadata = { title: 'Edit Profile · The JESUS App' };

export default async function EditProfilePage({ params }: Props) {
  const { username } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  // Only the profile owner can access edit
  const { data: myRow } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (myRow?.username !== username) redirect(`/profile/${username}`);

  const profile = await getFullProfile();
  if (!profile) redirect('/sign-in');

  return <EditProfileClient profile={profile} returnPath={`/profile/${username}`} />;
}

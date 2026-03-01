import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { getFullProfile } from '../../../../lib/profile/actions';
import { EditProfileClient } from './EditProfileClient';

export const metadata = { title: 'Edit Profile — The JESUS App' };

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const profile = await getFullProfile();
  if (!profile) redirect('/sign-in');

  return <EditProfileClient profile={profile} />;
}

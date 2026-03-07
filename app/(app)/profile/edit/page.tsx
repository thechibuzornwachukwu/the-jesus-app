import { redirect } from 'next/navigation';
import { getFullProfile } from '../../../../lib/profile/actions';
import { EditProfileClient } from './EditProfileClient';

export const metadata = { title: 'Edit Profile  The JESUS App' };

export default async function EditProfilePage() {
  const profile = await getFullProfile();
  if (!profile) redirect('/engage');

  return <EditProfileClient profile={profile} />;
}

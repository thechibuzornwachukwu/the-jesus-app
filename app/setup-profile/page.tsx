import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { SetupProfileClient } from './SetupProfileClient';

export const metadata = { title: 'Set Up Your Profile  The JESUS App' };

export default async function SetupProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  // If a profile already exists with a non-auto username, skip onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  // If the user already has a username, send them to their profile page.
  // This handles Google OAuth users whose profile was auto-created by the DB trigger.
  if (profile?.username) {
    redirect(`/profile/${profile.username}`);
  }

  const defaultUsername = profile?.username ?? '';

  return (
    <div className="setup-profile-shell">
      <SetupProfileClient defaultUsername={defaultUsername} />
    </div>
  );
}

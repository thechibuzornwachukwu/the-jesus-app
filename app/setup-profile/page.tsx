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

  // Auto-generated usernames are derived from email local-part with underscores —
  // they contain no spaces and are 30 chars max. A "real" username is one the user
  // explicitly set (we can't distinguish, so we always show setup on first visit).
  // To avoid an infinite loop we check: if profile exists AND username looks custom
  // (not just the email-derived default) we can skip. For simplicity: if the profile
  // row has a username that doesn't match the raw email-prefix pattern, redirect.
  if (profile?.username) {
    const emailPrefix = (user.email ?? user.id)
      .split('@')[0]
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .slice(0, 30);

    // If username differs from the auto-generated one, profile is already set up
    if (profile.username !== emailPrefix) {
      redirect('/explore');
    }
  }

  const defaultUsername = profile?.username ?? '';

  return (
    <div className="setup-profile-shell">
      <SetupProfileClient defaultUsername={defaultUsername} />
    </div>
  );
}

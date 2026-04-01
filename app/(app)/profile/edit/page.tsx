import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';

// Canonical edit route is now /profile/[username]/edit
export default async function EditProfileRedirect() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (!profile?.username) redirect('/sign-in');

  redirect(`/profile/${profile.username}/edit`);
}

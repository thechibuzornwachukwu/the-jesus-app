import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';

export default async function ProfileRootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (!profile?.username) redirect('/setup-profile');

  redirect(`/profile/${profile.username}`);
}

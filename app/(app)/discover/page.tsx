import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { DiscoverClient } from './DiscoverClient';

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  return <DiscoverClient />;
}

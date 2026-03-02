import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { LibraryClient } from './LibraryClient';

export const metadata = { title: 'Library | The JESUS App' };

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  return <LibraryClient />;
}


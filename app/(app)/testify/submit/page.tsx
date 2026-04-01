import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { SubmitTestimonyClient } from './SubmitTestimonyClient';

export const metadata = { title: 'Share Your Testimony — The JESUS App' };

export default async function SubmitTestimonyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  return <SubmitTestimonyClient />;
}

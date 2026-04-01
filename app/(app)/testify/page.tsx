import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { getTestimonies } from '../../../lib/testify/actions';
import { TestifyClient } from './TestifyClient';

export const metadata = { title: 'Testify — The JESUS App' };

export default async function TestifyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { testimonies } = await getTestimonies();

  return <TestifyClient initialTestimonies={testimonies} />;
}

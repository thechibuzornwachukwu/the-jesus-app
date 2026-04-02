import { notFound, redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { getTestimonyById } from '../../../../lib/testify/actions';
import { TestimonyDetailClient } from './TestimonyDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const testimony = await getTestimonyById(id);
  return { title: testimony ? `${testimony.title} | Testify` : 'Testimony | The JESUS App' };
}

export default async function TestimonyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: authData }, testimony] = await Promise.all([
    supabase.auth.getUser(),
    getTestimonyById(id),
  ]);

  if (!authData.user) redirect('/sign-in');
  if (!testimony) notFound();

  return <TestimonyDetailClient testimony={testimony} />;
}

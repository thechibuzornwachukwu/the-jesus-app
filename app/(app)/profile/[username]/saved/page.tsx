import { redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { EmptyState } from '../../../../../libs/shared-ui/EmptyState';
import { Bookmark } from 'lucide-react';

interface Props {
  params: Promise<{ username: string }>;
}

export const metadata = { title: 'Saved · The JESUS App' };

export default async function SavedPage({ params }: Props) {
  const { username } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: myRow } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (myRow?.username !== username) redirect(`/profile/${username}`);

  return (
    <div style={{ minHeight: '100%', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: 'calc(var(--safe-top) + var(--space-4)) var(--space-4) var(--space-3)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
          Saved
        </h1>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState icon={<Bookmark size={32} />} message="Saved verses and videos will appear here." />
      </div>
    </div>
  );
}

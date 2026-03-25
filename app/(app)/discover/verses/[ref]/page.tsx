import { redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';

interface Props {
  params: Promise<{ ref: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { ref } = await params;
  return { title: `${decodeURIComponent(ref)} · The JESUS App` };
}

export default async function VerseTagPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { ref } = await params;
  const verseRef = decodeURIComponent(ref);

  return (
    <div style={{ padding: 'var(--space-4)', color: 'var(--color-text)' }}>
      <h1
        style={{
          fontFamily: "'Archivo Condensed', var(--font-display)",
          fontSize: '1.6rem',
          fontWeight: 900,
          margin: '0 0 var(--space-4)',
        }}
      >
        {verseRef}
      </h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
        Posts tagged with this verse will appear here.
      </p>
    </div>
  );
}

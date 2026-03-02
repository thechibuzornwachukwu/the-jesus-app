import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { getBiblePassage, getBibleVerseOfDay } from '../../../lib/bible';
import { BibleClient } from './BibleClient';

export const metadata = { title: 'Bible | The JESUS App' };

export default async function BiblePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const [initialPassage, verseOfDay] = await Promise.all([
    getBiblePassage('John 1:1'),
    Promise.resolve(getBibleVerseOfDay()),
  ]);

  return (
    <BibleClient
      initialPassage={initialPassage}
      verseOfDay={verseOfDay}
    />
  );
}

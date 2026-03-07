import { getBiblePassage, getBibleVerseOfDay } from '../../../lib/bible';
import { BibleClient } from './BibleClient';

export const metadata = { title: 'Bible | The JESUS App' };

export default async function BiblePage() {
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

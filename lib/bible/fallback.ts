import type { BibleVerse } from './types';

export const FALLBACK_BIBLE_VERSES: BibleVerse[] = [
  {
    reference: 'Genesis 1:1',
    bookName: 'Genesis',
    chapter: 1,
    verse: 1,
    text: 'In the beginning God created the heaven and the earth.',
  },
  {
    reference: 'Psalm 23:1',
    bookName: 'Psalm',
    chapter: 23,
    verse: 1,
    text: 'The LORD is my shepherd; I shall not want.',
  },
  {
    reference: 'Psalm 119:105',
    bookName: 'Psalm',
    chapter: 119,
    verse: 105,
    text: 'Thy word is a lamp unto my feet, and a light unto my path.',
  },
  {
    reference: 'Proverbs 3:5',
    bookName: 'Proverbs',
    chapter: 3,
    verse: 5,
    text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
  },
  {
    reference: 'Proverbs 3:6',
    bookName: 'Proverbs',
    chapter: 3,
    verse: 6,
    text: 'In all thy ways acknowledge him, and he shall direct thy paths.',
  },
  {
    reference: 'Isaiah 41:10',
    bookName: 'Isaiah',
    chapter: 41,
    verse: 10,
    text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God.',
  },
  {
    reference: 'Matthew 5:14',
    bookName: 'Matthew',
    chapter: 5,
    verse: 14,
    text: 'Ye are the light of the world. A city that is set on an hill cannot be hid.',
  },
  {
    reference: 'Matthew 11:28',
    bookName: 'Matthew',
    chapter: 11,
    verse: 28,
    text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.',
  },
  {
    reference: 'John 1:1',
    bookName: 'John',
    chapter: 1,
    verse: 1,
    text: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
  },
  {
    reference: 'John 3:16',
    bookName: 'John',
    chapter: 3,
    verse: 16,
    text: 'For God so loved the world, that he gave his only begotten Son.',
  },
  {
    reference: 'John 14:6',
    bookName: 'John',
    chapter: 14,
    verse: 6,
    text: 'Jesus saith unto him, I am the way, the truth, and the life.',
  },
  {
    reference: 'Romans 8:1',
    bookName: 'Romans',
    chapter: 8,
    verse: 1,
    text: 'There is therefore now no condemnation to them which are in Christ Jesus.',
  },
  {
    reference: 'Romans 8:28',
    bookName: 'Romans',
    chapter: 8,
    verse: 28,
    text: 'And we know that all things work together for good to them that love God.',
  },
  {
    reference: 'Philippians 4:6',
    bookName: 'Philippians',
    chapter: 4,
    verse: 6,
    text: 'Be careful for nothing; but in every thing by prayer and supplication let your requests be made known unto God.',
  },
  {
    reference: 'Philippians 4:7',
    bookName: 'Philippians',
    chapter: 4,
    verse: 7,
    text: 'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
  },
  {
    reference: '2 Timothy 1:7',
    bookName: '2 Timothy',
    chapter: 1,
    verse: 7,
    text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.',
  },
];

export function findFallbackByReference(input: string): BibleVerse[] {
  const query = input.trim().toLowerCase();
  if (!query) return [];
  return FALLBACK_BIBLE_VERSES.filter((verse) => verse.reference.toLowerCase() === query);
}

export function findFallbackByKeyword(input: string): BibleVerse[] {
  const query = input.trim().toLowerCase();
  if (!query) return [];
  return FALLBACK_BIBLE_VERSES.filter((verse) => {
    return (
      verse.reference.toLowerCase().includes(query) ||
      verse.bookName.toLowerCase().includes(query) ||
      verse.text.toLowerCase().includes(query)
    );
  });
}

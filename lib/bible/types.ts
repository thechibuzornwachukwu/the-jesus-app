export type BibleVerse = {
  reference: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};

export type BiblePassage = {
  reference: string;
  text: string;
  translation: string;
  verses: BibleVerse[];
  source: 'api' | 'fallback';
};

export type BibleSearchResult = {
  query: string;
  mode: 'reference' | 'keyword';
  source: 'api' | 'fallback';
  passage?: BiblePassage;
  verses: BibleVerse[];
};

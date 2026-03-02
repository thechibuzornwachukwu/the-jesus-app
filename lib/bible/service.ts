import { getDailyVerse } from '../explore/daily-verses';
import {
  FALLBACK_BIBLE_VERSES,
  findFallbackByKeyword,
  findFallbackByReference,
} from './fallback';
import type { BiblePassage, BibleSearchResult, BibleVerse } from './types';

const API_BASE = process.env.BIBLE_API_BASE_URL || 'https://bible-api.com';
const DEFAULT_TRANSLATION = process.env.BIBLE_TRANSLATION || 'kjv';
const REQUEST_TIMEOUT_MS = 6000;

type BibleApiVerse = {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
};

type BibleApiResponse = {
  reference: string;
  text: string;
  translation_name?: string;
  verses?: BibleApiVerse[];
};

function isReferenceQuery(query: string): boolean {
  return /^[1-3]?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*\s+\d+(?::\d+(?:-\d+)?)?$/.test(query.trim());
}

function verseFromApi(reference: string, verse: BibleApiVerse): BibleVerse {
  return {
    reference: `${verse.book_name} ${verse.chapter}:${verse.verse}`,
    bookName: verse.book_name,
    chapter: verse.chapter,
    verse: verse.verse,
    text: verse.text.trim(),
  };
}

function normalizePassage(response: BibleApiResponse): BiblePassage | null {
  const verses = Array.isArray(response.verses)
    ? response.verses.map((verse) => verseFromApi(response.reference, verse))
    : [];
  const text = response.text?.trim() || verses.map((verse) => verse.text).join(' ');
  if (!response.reference || !text) return null;
  return {
    reference: response.reference,
    text,
    translation: (response.translation_name || DEFAULT_TRANSLATION).toUpperCase(),
    verses,
    source: 'api',
  };
}

async function fetchFromBibleApi(query: string): Promise<BiblePassage | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${API_BASE}/${encodeURIComponent(query)}?translation=${encodeURIComponent(DEFAULT_TRANSLATION)}`,
      {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 },
      }
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as BibleApiResponse;
    return normalizePassage(payload);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function fallbackPassageForReference(reference: string): BiblePassage | null {
  const exact = findFallbackByReference(reference);
  const lower = reference.trim().toLowerCase();
  const verses = exact.length
    ? exact
    : FALLBACK_BIBLE_VERSES.filter((verse) => verse.reference.toLowerCase().startsWith(lower));
  if (verses.length === 0) return null;
  return {
    reference: reference.trim(),
    text: verses.map((verse) => verse.text).join(' '),
    translation: 'KJV (fallback)',
    verses,
    source: 'fallback',
  };
}

function fallbackSearch(query: string): BibleSearchResult {
  const verses = isReferenceQuery(query)
    ? findFallbackByReference(query)
    : findFallbackByKeyword(query);
  return {
    query,
    mode: isReferenceQuery(query) ? 'reference' : 'keyword',
    source: 'fallback',
    passage: isReferenceQuery(query)
      ? fallbackPassageForReference(query) || undefined
      : undefined,
    verses,
  };
}

export async function getBiblePassage(reference: string): Promise<BiblePassage | null> {
  const input = reference.trim();
  if (!input) return null;
  const fromApi = await fetchFromBibleApi(input);
  if (fromApi) return fromApi;
  return fallbackPassageForReference(input);
}

export async function searchBible(query: string): Promise<BibleSearchResult> {
  const input = query.trim();
  if (!input) {
    return {
      query: input,
      mode: 'keyword',
      source: 'fallback',
      verses: [],
    };
  }

  if (isReferenceQuery(input)) {
    const passage = await getBiblePassage(input);
    return {
      query: input,
      mode: 'reference',
      source: passage?.source || 'fallback',
      passage: passage || undefined,
      verses: passage?.verses || [],
    };
  }

  const fromApi = await fetchFromBibleApi(input);
  if (fromApi && fromApi.verses.length > 0) {
    return {
      query: input,
      mode: 'keyword',
      source: 'api',
      passage: fromApi,
      verses: fromApi.verses,
    };
  }

  return fallbackSearch(input);
}

export function getBibleVerseOfDay() {
  return getDailyVerse();
}

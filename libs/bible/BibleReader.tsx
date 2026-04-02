'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  Search,
  Sparkles,
  Loader2,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X,
  List,
  Type,
} from 'lucide-react';
import type { DailyVerseType } from '../../lib/explore/types';
import type { BiblePassage, BibleVerse } from '../../lib/bible/types';
import { saveVerse } from '../../lib/explore/actions';
import { showToast } from '../../libs/shared-ui/Toast';
import { BIBLE_BOOKS, MAX_VERSE } from '../../lib/bible/books';
import { useBerean } from '../../lib/berean/context';
import { getDailyVerse } from '../../lib/explore/daily-verses';

export interface BibleReaderProps {
  initialPassage?: BiblePassage | null;
  verseOfDay?: DailyVerseType;
  /** Extra padding at the bottom of the scroll area (e.g. nav height). Default '32px' */
  bottomPadding?: string;
}

const QUICK_REFERENCES = [
  'John 3:16',
  'Psalm 23:1',
  'Romans 8:28',
  'Philippians 4:6',
  'Matthew 11:28',
  'Isaiah 41:10',
  'Proverbs 3:5',
];

const navBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-1-5)',
  background: 'none',
  border: 'none',
  color: 'var(--color-accent)',
  fontFamily: 'var(--font-sans)',
  fontWeight: 700,
  fontSize: 'var(--font-size-sm)',
  cursor: 'pointer',
  padding: 'var(--space-2) 0',
};

function isReferenceQuery(q: string) {
  return /^(\d\s+)?[a-z]+\.?\s+\d+(\s*:\s*\d+(-\d+)?)?$/i.test(q.trim());
}

function PassageReader({
  passage,
  onNavigate,
  onAskBerean,
}: {
  passage: BiblePassage;
  onNavigate: (ref: string) => void;
  onAskBerean?: (reference: string) => void;
}) {
  const [savedVerses, setSavedVerses] = useState<Set<string>>(new Set());

  const firstVerse = passage.verses[0];
  const bookName = firstVerse?.bookName || '';
  const chapter = firstVerse?.chapter || 0;
  const prevRef = chapter > 1 ? `${bookName} ${chapter - 1}` : null;
  const nextRef = chapter > 0 ? `${bookName} ${chapter + 1}` : null;

  async function handleSaveVerse(verse: BibleVerse) {
    if (savedVerses.has(verse.reference)) return;
    const { error } = await saveVerse(verse.reference, verse.text);
    if (error) { showToast(error, 'error'); return; }
    setSavedVerses((prev) => new Set([...prev, verse.reference]));
    showToast('Verse saved', 'success');
  }

  const verses =
    passage.verses.length > 0
      ? passage.verses
      : [{ reference: passage.reference, bookName: '', chapter: 0, verse: 0, text: passage.text }];

  return (
    <section>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-serif)',
            fontVariant: 'small-caps',
            fontWeight: 700,
            fontSize: 'var(--font-size-2xl)',
            letterSpacing: '0.04em',
            color: 'var(--color-text-primary)',
          }}
        >
          {bookName && chapter ? `${bookName} · ${chapter}` : passage.reference}
        </h2>
        <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
          {passage.translation}
        </p>
      </div>

      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 'var(--font-size-xl)',
          lineHeight: 2,
          margin: 0,
          color: 'var(--color-text-primary)',
        }}
      >
        {verses.map((verse) => (
          <span key={verse.reference}>
            <sup
              title={`Save ${verse.reference}`}
              onClick={() => handleSaveVerse(verse)}
              style={{
                color: savedVerses.has(verse.reference)
                  ? 'var(--color-accent)'
                  : 'var(--color-text-faint)',
                fontSize: 'var(--font-size-xs)',
                fontStyle: 'normal',
                fontFamily: 'var(--font-sans)',
                marginRight: '0.2em',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'color 0.15s',
              }}
            >
              {verse.verse || ''}
            </sup>
            {verse.text}{' '}
          </span>
        ))}
      </p>

      {(prevRef || nextRef) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 'var(--space-8)',
            paddingTop: 'var(--space-5)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {prevRef ? (
            <button onClick={() => onNavigate(prevRef)} style={navBtnStyle}>
              <ChevronLeft size={16} />
              {prevRef}
            </button>
          ) : (
            <span />
          )}
          {nextRef && (
            <button onClick={() => onNavigate(nextRef)} style={navBtnStyle}>
              {nextRef}
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}

      {onAskBerean && (
        <div style={{ marginTop: 'var(--space-5)' }}>
          <button
            onClick={() => onAskBerean(passage.reference)}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: 'var(--space-2) var(--space-3-5)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontWeight: 700,
              fontSize: 'var(--font-size-xs)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-1-5)',
              cursor: 'pointer',
            }}
          >
            <MessageCircle size={14} />
            Ask Berean about {passage.reference}
          </button>
        </div>
      )}
    </section>
  );
}

function SearchVerseRow({ verse }: { verse: BibleVerse }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving || saved) return;
    setSaving(true);
    const { error } = await saveVerse(verse.reference, verse.text);
    setSaving(false);
    if (error) { showToast(error, 'error'); return; }
    setSaved(true);
    showToast('Verse saved', 'success');
  }

  return (
    <div style={{ padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
      <p style={{ margin: 0, color: 'var(--color-accent)', fontSize: 'var(--font-size-xs)', fontWeight: 700, letterSpacing: '0.05em' }}>
        {verse.reference}
      </p>
      <p style={{ margin: 'var(--space-2) 0 var(--space-2)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'var(--font-size-lg)', lineHeight: 1.7 }}>
        {verse.text}
      </p>
      <button
        onClick={handleSave}
        disabled={saving || saved}
        style={{ background: 'none', border: 'none', color: saved ? 'var(--color-accent)' : 'var(--color-text-faint)', fontSize: 'var(--font-size-xs)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', cursor: saved ? 'default' : 'pointer', padding: 0 }}
      >
        <Bookmark size={12} fill={saved ? 'currentColor' : 'none'} />
        {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 'var(--size-input-compact)',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--font-size-caption)',
  fontWeight: 600,
  padding: '0 var(--space-2)',
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
};

function BookChapterSelector({ onGo }: { onGo: (ref: string) => void }) {
  const [book, setBook] = useState(BIBLE_BOOKS[0].name);
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState(0);

  const currentBook = BIBLE_BOOKS.find((b) => b.name === book) ?? BIBLE_BOOKS[0];
  const chapterCount = currentBook.chapters;

  function handleBookChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newBook = BIBLE_BOOKS.find((b) => b.name === e.target.value) ?? BIBLE_BOOKS[0];
    setBook(newBook.name);
    setChapter(1);
    setVerse(0);
  }

  function handleChapterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setChapter(Number(e.target.value));
    setVerse(0);
  }

  function handleGo() {
    const ref = verse > 0 ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`;
    onGo(ref);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-1-5)' }}>
        <div style={{ position: 'relative', flex: 2, minWidth: 0 }}>
          <select value={book} onChange={handleBookChange} style={selectStyle}>
            {BIBLE_BOOKS.map((b) => (
              <option key={b.abbr} value={b.name}>{b.name}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-2xs)' }}>▾</span>
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <select value={chapter} onChange={handleChapterChange} style={selectStyle}>
            {Array.from({ length: chapterCount }, (_, i) => i + 1).map((ch) => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-2xs)' }}>▾</span>
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <select value={verse} onChange={(e) => setVerse(Number(e.target.value))} style={selectStyle}>
            <option value={0}>All</option>
            {Array.from({ length: MAX_VERSE }, (_, i) => i + 1).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-2xs)' }}>▾</span>
        </div>
      </div>
      <button
        onClick={handleGo}
        style={{
          height: 'var(--size-input-compact)',
          background: 'var(--color-accent)',
          border: 'none',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--color-accent-text)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: 'var(--font-size-sm)',
          cursor: 'pointer',
          letterSpacing: '0.03em',
        }}
      >
        Go
      </button>
    </div>
  );
}

export function BibleReader({
  initialPassage = null,
  verseOfDay,
  bottomPadding = 'calc(var(--nav-height) + var(--safe-bottom) + var(--space-10))',
}: BibleReaderProps) {
  const { openBerean } = useBerean();
  const resolvedVerse = verseOfDay ?? getDailyVerse();

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectorMode, setSelectorMode] = useState<'text' | 'structured'>('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passage, setPassage] = useState<BiblePassage | null>(initialPassage ?? null);
  const [searchMode, setSearchMode] = useState<'read' | 'search'>('read');
  const [searchResults, setSearchResults] = useState<BibleVerse[]>(initialPassage?.verses || []);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && selectorMode === 'text') {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [searchOpen, selectorMode]);

  function toggleSearch() {
    setSearchOpen((v) => !v);
    if (searchOpen) setQuery('');
  }

  async function readPassage(reference: string) {
    const trimmed = reference.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bible/passage?reference=${encodeURIComponent(trimmed)}`);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to read passage');
      setPassage(payload.passage as BiblePassage);
      setSearchResults((payload.passage as BiblePassage).verses || []);
      setSearchMode('read');
      setSearchOpen(false);
      setQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load passage');
    } finally {
      setLoading(false);
    }
  }

  async function searchKeyword(rawQuery: string) {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bible/search?q=${encodeURIComponent(trimmed)}`);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Search failed');
      setSearchResults((payload.verses as BibleVerse[]) || []);
      setSearchMode('search');
      if (payload.passage) setPassage(payload.passage as BiblePassage);
      setSearchOpen(false);
      setQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run search');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (isReferenceQuery(trimmed)) void readPassage(trimmed);
    else void searchKeyword(trimmed);
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Sticky top bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--color-bg)',
          borderBottom: searchOpen ? '1px solid var(--color-border)' : '1px solid transparent',
          transition: 'border-color 0.2s',
          flexShrink: 0,
        }}
      >
        {/* Title row */}
        <div
          style={{
            height: 'var(--space-14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--space-5)',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: "'Archivo Condensed', var(--font-display)",
              fontSize: 'var(--font-size-4xl)',
              lineHeight: 1,
              letterSpacing: 'var(--letter-spacing-tight)',
            }}
          >
            Bible
          </h1>
          <button
            onClick={toggleSearch}
            aria-label={searchOpen ? 'Close search' : 'Open search'}
            style={{
              width: 'var(--space-10)',
              height: 'var(--space-10)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: searchOpen ? 'var(--color-accent-soft)' : 'none',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              color: searchOpen ? 'var(--color-accent)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
        </div>

        {/* Sliding search panel */}
        <div
          style={{
            overflow: 'hidden',
            maxHeight: searchOpen ? (selectorMode === 'structured' ? 200 : 160) : 0,
            opacity: searchOpen ? 1 : 0,
            transition: 'max-height 0.3s ease, opacity 0.2s ease',
            padding: searchOpen ? '0 var(--space-5) var(--space-4)' : '0 var(--space-5)',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--space-1-5)', marginBottom: 'var(--space-3)' }}>
            {(['text', 'structured'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectorMode(mode)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  padding: 'var(--space-1) var(--space-3)',
                  borderRadius: 'var(--radius-full)',
                  border: selectorMode === mode ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  background: selectorMode === mode ? 'var(--color-accent-soft)' : 'var(--color-surface)',
                  color: selectorMode === mode ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                }}
              >
                {mode === 'text' ? <><Type size={12} /> Text</> : <><List size={12} /> Browse</>}
              </button>
            ))}
          </div>

          {selectorMode === 'text' ? (
            <>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                placeholder="John 3:16, peace, faith…"
                className="field-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <div
                style={{
                  marginTop: 'var(--space-3)',
                  display: 'flex',
                  gap: 'var(--space-2)',
                  overflowX: 'auto',
                  scrollbarWidth: 'none' as const,
                }}
              >
                {QUICK_REFERENCES.map((ref) => (
                  <button
                    key={ref}
                    onClick={() => void readPassage(ref)}
                    style={{
                      flexShrink: 0,
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text-muted)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      padding: 'var(--space-1-5) var(--space-3)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ref}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <BookChapterSelector onGo={(ref) => { void readPassage(ref); }} />
          )}
        </div>

        {loading && (
          <div style={{ padding: '0 var(--space-5) var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-caption)' }}>
            <Loader2 size={13} className="spin-icon" />
            Loading scripture…
          </div>
        )}
        {error && !loading && (
          <div style={{ padding: '0 var(--space-5) var(--space-2)', color: 'var(--color-error)', fontSize: 'var(--font-size-caption)' }}>
            {error}
          </div>
        )}
      </header>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-5)',
          paddingBottom: bottomPadding,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}
      >
        {/* Verse of the Day */}
        <section
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            background:
              'radial-gradient(140% 120% at 10% 0%, rgba(232,192,128,0.18) 0%, rgba(22,16,9,0.85) 55%, var(--color-surface) 100%)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <p
            style={{
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-1-5)',
              color: 'var(--color-accent)',
              fontSize: 'var(--font-size-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 700,
            }}
          >
            <Sparkles size={12} />
            Verse of the Day
          </p>
          <p
            style={{
              margin: 'var(--space-2) 0 0',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              lineHeight: 'var(--line-height-relaxed)',
              fontSize: 'var(--font-size-lg)',
            }}
          >
            {resolvedVerse.text}
          </p>
          <p style={{ margin: 'var(--space-3) 0 0', color: 'var(--color-accent)', fontWeight: 700 }}>
            {resolvedVerse.reference}
          </p>
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
            <button
              onClick={async () => {
                const { error: saveError } = await saveVerse(resolvedVerse.reference, resolvedVerse.text);
                if (saveError) showToast(saveError, 'error');
                else showToast('Verse saved', 'success');
              }}
              style={{
                border: '1px solid var(--color-accent)',
                borderRadius: 'var(--radius-full)',
                padding: 'var(--space-2) var(--space-3)',
                background: 'transparent',
                color: 'var(--color-accent)',
                fontWeight: 700,
                fontSize: 'var(--font-size-xs)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1-5)',
                cursor: 'pointer',
              }}
            >
              <Bookmark size={14} />
              Save
            </button>
            <button
              onClick={() => openBerean(`Tell me about ${resolvedVerse.reference}: ${resolvedVerse.text}`)}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-full)',
                padding: 'var(--space-2) var(--space-3)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontWeight: 700,
                fontSize: 'var(--font-size-xs)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1-5)',
                cursor: 'pointer',
              }}
            >
              <MessageCircle size={14} />
              Ask Berean
            </button>
          </div>
        </section>

        {/* Passage reader */}
        {searchMode === 'read' && passage && (
          <PassageReader
            passage={passage}
            onNavigate={(ref) => void readPassage(ref)}
            onAskBerean={(ref) => openBerean(`Explain the passage ${ref} and its meaning for my faith.`)}
          />
        )}

        {/* Search results */}
        {searchMode === 'search' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontFamily: 'var(--font-serif)', fontVariant: 'small-caps', fontWeight: 700 }}>
                Search Results
              </h2>
              <span style={{ color: 'var(--color-text-faint)', fontSize: 'var(--font-size-xs)' }}>
                {searchResults.length} match{searchResults.length === 1 ? '' : 'es'}
              </span>
            </div>
            {searchResults.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No verses found.</p>
            )}
            {searchResults.map((verse, i) => (
              <SearchVerseRow key={`${verse.reference}-${i}`} verse={verse} />
            ))}
          </section>
        )}

        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-faint)' }}>
          Need deeper guidance?{' '}
          <button
            onClick={() => openBerean()}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-accent)', fontSize: 'var(--font-size-xs)', fontWeight: 700, cursor: 'pointer' }}
          >
            Open Berean
          </button>{' '}
          to ask questions about what you are reading.
        </p>
      </div>

      <style>{`
        .spin-icon { animation: bible-spin 1s linear infinite; }
        @keyframes bible-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

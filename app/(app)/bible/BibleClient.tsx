'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Bookmark, Search, Sparkles, Loader2, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DailyVerseType } from '../../../lib/explore/types';
import type { BiblePassage, BibleVerse } from '../../../lib/bible';
import { saveVerse } from '../../../lib/explore/actions';
import { showToast } from '../../../libs/shared-ui';

interface BibleClientProps {
  initialPassage: BiblePassage | null;
  verseOfDay: DailyVerseType;
}

const QUICK_REFERENCES = [
  'John 3:16',
  'Psalm 23:1',
  'Romans 8:28',
  'Philippians 4:6',
  'Matthew 11:28',
];

const navBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'none',
  border: 'none',
  color: 'var(--color-accent)',
  fontFamily: 'var(--font-sans)',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  padding: '8px 0',
};

function PassageReader({
  passage,
  onNavigate,
}: {
  passage: BiblePassage;
  onNavigate: (ref: string) => void;
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

  const verses = passage.verses.length > 0
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
        <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-muted)', fontSize: 12 }}>
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
                fontSize: '0.6em',
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
      <p style={{ margin: 0, color: 'var(--color-accent)', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>
        {verse.reference}
      </p>
      <p style={{ margin: 'var(--space-2) 0 var(--space-2)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'var(--font-size-lg)', lineHeight: 1.7 }}>
        {verse.text}
      </p>
      <button
        onClick={handleSave}
        disabled={saving || saved}
        style={{ background: 'none', border: 'none', color: saved ? 'var(--color-accent)' : 'var(--color-text-faint)', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: saved ? 'default' : 'pointer', padding: 0 }}
      >
        <Bookmark size={12} fill={saved ? 'currentColor' : 'none'} />
        {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

export function BibleClient({ initialPassage, verseOfDay }: BibleClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState('John 1:1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passage, setPassage] = useState<BiblePassage | null>(initialPassage);
  const [searchMode, setSearchMode] = useState<'read' | 'search'>('read');
  const [searchResults, setSearchResults] = useState<BibleVerse[]>(initialPassage?.verses || []);
  const [searchSource, setSearchSource] = useState<'api' | 'fallback' | null>(
    initialPassage?.source || null
  );

  const helperText = useMemo(() => {
    if (searchSource === 'fallback') return 'Showing fallback results (API unavailable).';
    if (searchSource === 'api') return 'Showing live API results.';
    return '';
  }, [searchSource]);

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
      setSearchSource((payload.passage as BiblePassage).source);
      setSearchMode('read');
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
      setSearchSource(payload.source as 'api' | 'fallback');
      setSearchMode('search');
      if (payload.passage) setPassage(payload.passage as BiblePassage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run search');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: 'var(--space-6) var(--space-5)',
        paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + var(--space-10))',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-5)',
      }}
    >
      <header>
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
        <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-muted)', fontSize: 14 }}>
          Read, search, save, and open Berean in one flow.
        </p>
      </header>

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
            gap: 6,
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
          {verseOfDay.text}
        </p>
        <p style={{ margin: 'var(--space-3) 0 0', color: 'var(--color-accent)', fontWeight: 700 }}>
          {verseOfDay.reference}
        </p>
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={async () => {
              const { error: saveError } = await saveVerse(verseOfDay.reference, verseOfDay.text);
              if (saveError) showToast(saveError, 'error');
              else showToast('Verse saved', 'success');
            }}
            style={{
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius-full)',
              padding: '8px 12px',
              background: 'transparent',
              color: 'var(--color-accent)',
              fontWeight: 700,
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Bookmark size={14} />
            Save
          </button>
          <button
            onClick={() => router.push('/learn?berean=1')}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: '8px 12px',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontWeight: 700,
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <MessageCircle size={14} />
            Open Berean
          </button>
        </div>
      </section>

      <section
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-4)',
          background: 'var(--color-surface)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Reference or keyword (e.g. John 3:16, peace)"
            className="field-input"
            style={{ flex: 1 }}
          />
          <button
            onClick={() => readPassage(query)}
            disabled={loading}
            style={{
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '0 12px',
              background: 'var(--color-accent)',
              color: 'var(--color-accent-text)',
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <BookOpen size={16} />
            Read
          </button>
          <button
            onClick={() => searchKeyword(query)}
            disabled={loading}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0 12px',
              background: 'var(--color-surface-high)',
              color: 'var(--color-text-primary)',
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Search size={16} />
            Search
          </button>
        </div>

        <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {QUICK_REFERENCES.map((ref) => (
            <button
              key={ref}
              onClick={() => {
                setQuery(ref);
                void readPassage(ref);
              }}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-surface-high)',
                color: 'var(--color-text-muted)',
                fontSize: 12,
                padding: '6px 10px',
                cursor: 'pointer',
              }}
            >
              {ref}
            </button>
          ))}
        </div>

        {loading && (
          <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader2 size={14} className="spin-icon" />
            Loading scripture...
          </p>
        )}
        {error && (
          <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-error)' }}>
            {error}
          </p>
        )}
        {!loading && helperText && (
          <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-faint)', fontSize: 12 }}>
            {helperText}
          </p>
        )}
      </section>

      {searchMode === 'read' && passage && (
        <PassageReader
          passage={passage}
          onNavigate={(ref) => {
            setQuery(ref);
            void readPassage(ref);
          }}
        />
      )}

      {searchMode === 'search' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-serif)', fontVariant: 'small-caps', fontWeight: 700 }}>
              Search Results
            </h2>
            <span style={{ color: 'var(--color-text-faint)', fontSize: 12 }}>
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

      <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-faint)' }}>
        Need deeper guidance?{' '}
        <Link href="/learn?berean=1" style={{ color: 'var(--color-accent)' }}>
          Open Berean
        </Link>{' '}
        to ask questions about what you are reading.
      </p>

      <style>{`
        .spin-icon {
          animation: bible-spin 1s linear infinite;
        }
        @keyframes bible-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

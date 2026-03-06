'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, ExternalLink, Search } from 'lucide-react';
import { LIBRARY_BOOKS } from '../../../lib/learn/library-content';

const ALL_FILTER = 'All';

export function LibraryClient() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(ALL_FILTER);

  const filters = useMemo(() => {
    const tagSet = new Set<string>();
    for (const book of LIBRARY_BOOKS) {
      for (const tag of book.tags) tagSet.add(tag);
    }
    return [ALL_FILTER, ...Array.from(tagSet)];
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const books = useMemo(() => {
    return LIBRARY_BOOKS.filter((book) => {
      const matchesFilter = filter === ALL_FILTER || book.tags.includes(filter);
      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;
      const haystack = `${book.title} ${book.author} ${book.summary} ${book.tags.join(' ')}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [filter, normalizedQuery]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky back-nav header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-4)',
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => router.push('/learn')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: 'var(--color-text)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
            padding: '8px 0',
          }}
        >
          <ArrowLeft size={18} />
          Equip
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-6)',
          paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + var(--space-8))',
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
          Library
        </h1>
        <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-muted)', fontSize: 14 }}>
          Read and download discipleship books from the Equip collection.
        </p>
      </header>

      <section
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-4)',
          background: 'var(--color-surface)',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-faint)',
            }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, author, or theme"
            className="field-input"
            style={{ paddingLeft: 36 }}
          />
        </div>
        <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {filters.map((item) => {
            const active = item === filter;
            return (
              <button
                key={item}
                onClick={() => setFilter(item)}
                style={{
                  border: active ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  background: active ? 'var(--color-accent-soft)' : 'var(--color-surface-high)',
                  color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  padding: '6px 11px',
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
        {books.map((book) => (
          <article
            key={book.id}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              background: 'var(--color-surface)',
            }}
          >
            <div
              style={{
                padding: 'var(--space-4)',
                background: book.cover.background,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: 'var(--font-size-xs)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                {book.author}
              </p>
              <h2
                style={{
                  margin: 'var(--space-2) 0 0',
                  color: '#f6f4ef',
                  fontSize: 'var(--font-size-xl)',
                  lineHeight: 1.2,
                }}
              >
                {book.title}
              </h2>
            </div>

            <div style={{ padding: 'var(--space-4)' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: 'var(--color-text-muted)',
                  lineHeight: 'var(--line-height-relaxed)',
                }}
              >
                {book.summary}
              </p>

              <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {book.tags.map((tag) => (
                  <span
                    key={`${book.id}-${tag}`}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-full)',
                      padding: '5px 10px',
                      fontSize: 11,
                      color: 'var(--color-text-faint)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
                <a
                  href={book.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    border: `1px solid ${book.cover.accent}`,
                    borderRadius: 'var(--radius-full)',
                    background: 'transparent',
                    color: book.cover.accent,
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 12,
                    padding: '9px 10px',
                    textAlign: 'center',
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ExternalLink size={14} />
                  Open
                </a>
                <a
                  href={book.filePath}
                  download={book.downloadName}
                  style={{
                    flex: 1,
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-surface-high)',
                    color: 'var(--color-text-primary)',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 12,
                    padding: '9px 10px',
                    textAlign: 'center',
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Download size={14} />
                  Download
                </a>
              </div>
            </div>
          </article>
        ))}
      </section>

      {books.length === 0 && (
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>
          No books match your current search/filter.
        </p>
      )}

      <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-faint)' }}>
        Prefer quick access? <Link href="/learn" style={{ color: 'var(--color-accent)' }}>Back to Equip</Link>.
      </p>
      </div>
    </div>
  );
}


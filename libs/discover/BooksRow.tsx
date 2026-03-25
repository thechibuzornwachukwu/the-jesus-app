'use client';

import React, { useState } from 'react';
import { ExternalLink, BookOpen, X } from 'lucide-react';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { Skeleton } from '../shared-ui/Skeleton';
import { vibrate } from '../shared-ui/haptics';
import type { BookResult } from '../../lib/discover/actions';

// Genre → accent color mapping
const GENRE_COLORS: Record<string, string> = {
  Apologetics: '#7c3aed',
  Devotional: '#f59e0b',
  Discipleship: '#0ea5e9',
  Theology: '#6366f1',
  'Spiritual Formation': '#10b981',
  'Spiritual Warfare': '#ef4444',
  Prayer: '#06b6d4',
  'Bible Study': '#84cc16',
  Gospel: '#f472b6',
  Fiction: '#fb923c',
  Memoir: '#a78bfa',
  'Christian Living': '#34d399',
  Classic: '#fbbf24',
};

function genreColor(genre: string) {
  return GENRE_COLORS[genre] ?? 'var(--color-accent)';
}

interface BooksRowProps {
  books: BookResult[];
  loading?: boolean;
}

function BookSheet({ book, onClose }: { book: BookResult; onClose: () => void }) {
  const color = genreColor(book.genre);

  return (
    <BottomSheet open onClose={onClose} title={book.title}>
      {/* Color band */}
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: color,
          marginBottom: 'var(--space-4)',
        }}
      />

      {/* Genre chip */}
      <span
        style={{
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: 'var(--radius-full)',
          background: `${color}22`,
          color,
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 'var(--space-3)',
        }}
      >
        {book.genre}
      </span>

      <h2
        style={{
          margin: '0 0 var(--space-1)',
          fontFamily: "'Archivo Condensed', var(--font-display)",
          fontSize: '1.4rem',
          fontWeight: 900,
          color: 'var(--color-text)',
          lineHeight: 1.15,
        }}
      >
        {book.title}
      </h2>

      <p
        style={{
          margin: '0 0 var(--space-3)',
          fontSize: 13,
          color: 'var(--color-text-muted)',
          fontStyle: 'italic',
        }}
      >
        {book.author}
      </p>

      <p
        style={{
          margin: '0 0 var(--space-5)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text)',
          lineHeight: 1.6,
        }}
      >
        {book.description}
      </p>

      {/* CTA */}
      <a
        href={`https://www.google.com/search?q=${encodeURIComponent(book.title + ' ' + book.author + ' book')}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          width: '100%',
          padding: '12px 0',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-accent)',
          color: 'var(--color-accent-text)',
          fontSize: 15,
          fontWeight: 700,
          textDecoration: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
        onClick={() => vibrate([8])}
      >
        <BookOpen size={16} aria-hidden />
        Find This Book
        <ExternalLink size={13} aria-hidden />
      </a>
    </BottomSheet>
  );
}

export function BooksRow({ books, loading }: BooksRowProps) {
  const [selected, setSelected] = useState<BookResult | null>(null);

  return (
    <section>
      <p
        style={{
          margin: '0 0 var(--space-2) var(--space-4)',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        Recommended Books
      </p>

      <div
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingLeft: 'var(--space-4)',
          paddingRight: 'var(--space-4)',
          paddingBottom: 4,
        }}
      >
        {loading
          ? [...Array(5)].map((_, i) => (
              <Skeleton key={i} style={{ height: 150, width: 110, borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
            ))
          : books.map((b) => {
              const color = genreColor(b.genre);
              return (
                <button
                  key={b.id}
                  onClick={() => { vibrate([8]); setSelected(b); }}
                  style={{
                    flexShrink: 0,
                    width: 110,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    background: 'var(--color-surface)',
                    boxShadow: `0 2px 12px ${color}33`,
                    transition: 'transform 0.12s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                >
                  {/* Cover band */}
                  <div
                    style={{
                      height: 90,
                      background: `linear-gradient(140deg, ${color}cc 0%, ${color}55 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BookOpen size={28} color="#fff" strokeWidth={1.5} aria-hidden />
                  </div>

                  {/* Info */}
                  <div style={{ padding: '8px 8px 10px' }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--color-text)',
                        lineHeight: 1.2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      } as React.CSSProperties}
                    >
                      {b.title}
                    </p>
                    <p
                      style={{
                        margin: '3px 0 0',
                        fontSize: 10,
                        color: 'var(--color-text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {b.author}
                    </p>
                  </div>
                </button>
              );
            })}
      </div>

      {selected && (
        <BookSheet book={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}

'use client';

import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Skeleton } from '../shared-ui/Skeleton';
import { vibrate } from '../shared-ui/haptics';
import { BookSheet, genreColor } from './BookSheet';
import type { Book } from '../../lib/discover/books';

// BookResult is re-exported as Book from lib/discover/books
export type { Book as BookResult };

interface BooksRowProps {
  books: Book[];
  loading?: boolean;
}

export function BooksRow({ books, loading }: BooksRowProps) {
  const [selected, setSelected] = useState<Book | null>(null);

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
              const color = b.coverColor ?? genreColor(b.genre);
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

'use client';

import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Skeleton } from '../shared-ui/Skeleton';
import { vibrate } from '../shared-ui/haptics';
import { BookSheet, genreColor } from './BookSheet';
import type { Book } from '../../lib/discover/books';

interface BooksRowProps {
  books: Book[];
  loading?: boolean;
}

function BookCard({ book, onOpen }: { book: Book; onOpen: (b: Book) => void }) {
  const color = book.coverColor ?? genreColor(book.genre);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => { vibrate([8]); onOpen(book); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { vibrate([8]); onOpen(book); } }}
      style={{
        flexShrink: 0,
        width: 110,
        cursor: 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Cover */}
      <div
        style={{
          width: '100%',
          height: 150,
          borderRadius: 'var(--radius-md)',
          background: `linear-gradient(140deg, ${color}cc 0%, ${color}55 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          border: `1px solid ${color}44`,
          transition: 'transform 0.12s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.97)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
      >
        <BookOpen size={32} color="#fff" strokeWidth={1.2} aria-hidden />
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--color-text)',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } as React.CSSProperties}
      >
        {book.title}
      </p>
      <p
        style={{
          margin: '2px 0 0',
          fontSize: 11,
          color: 'var(--color-text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {book.author}
      </p>
    </div>
  );
}

export function BooksRow({ books, loading }: BooksRowProps) {
  const [openBook, setOpenBook] = useState<Book | null>(null);

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
          gap: 12,
          overflowX: 'auto',
          paddingLeft: 'var(--space-4)',
          paddingRight: 'var(--space-4)',
          paddingBottom: 4,
        }}
      >
        {loading
          ? [...Array(5)].map((_, i) => (
              <Skeleton
                key={i}
                style={{ height: 185, width: 110, borderRadius: 'var(--radius-md)', flexShrink: 0 }}
              />
            ))
          : books.map((b) => <BookCard key={b.id} book={b} onOpen={setOpenBook} />)}
      </div>

      {openBook && <BookSheet book={openBook} onClose={() => setOpenBook(null)} />}
    </section>
  );
}

'use client';

import React, { useState } from 'react';
import { ExternalLink, X, BookOpen, Quote } from 'lucide-react';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { vibrate } from '../shared-ui/haptics';
import type { Book } from '../../lib/discover/books';

export function genreColor(genre: string): string {
  const map: Record<string, string> = {
    Apologetics: '#7c3aed',
    Devotional: '#f59e0b',
    Discipleship: '#0ea5e9',
    Theology: '#6366f1',
    'Spiritual Formation': '#10b981',
    'Spiritual Warfare': '#ef4444',
    Prayer: '#06b6d4',
    Gospel: '#f472b6',
    Fiction: '#fb923c',
    Classic: '#fbbf24',
    Memoir: '#a78bfa',
    'Christian Living': '#34d399',
    'Bible Study': '#84cc16',
  };
  return map[genre] ?? '#6b7280';
}

interface BookSheetProps {
  book: Book;
  onClose: () => void;
}

export function BookSheet({ book, onClose }: BookSheetProps) {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const color = book.coverColor ?? genreColor(book.genre);

  function cycleQuote() {
    vibrate([4]);
    setQuoteIdx((i) => (i + 1) % book.quotes.length);
  }

  return (
    <BottomSheet onClose={onClose}>
      {/* Cover banner */}
      <div
        style={{
          height: 120,
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          background: `linear-gradient(135deg, ${color}cc 0%, ${color}44 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <BookOpen size={48} color="#fff" strokeWidth={1.2} aria-hidden />
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(0,0,0,0.3)',
            border: 'none',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
          }}
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Title + author */}
        <div>
          <h2
            style={{
              margin: '0 0 4px',
              fontFamily: "'Archivo Condensed', var(--font-display)",
              fontSize: '1.4rem',
              fontWeight: 900,
              color: 'var(--color-text)',
              lineHeight: 1.1,
            }}
          >
            {book.title}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            by {book.author}
          </p>
          <span
            style={{
              display: 'inline-block',
              marginTop: 6,
              padding: '2px 10px',
              borderRadius: 'var(--radius-full)',
              background: `${color}22`,
              color,
              fontSize: 11,
              fontWeight: 700,
              border: `1px solid ${color}44`,
            }}
          >
            {book.genre}
          </span>
        </div>

        {/* Description */}
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6 }}>
          {book.description}
        </p>

        {/* Quote rotator */}
        <button
          onClick={cycleQuote}
          style={{
            textAlign: 'left',
            background: 'var(--color-surface)',
            border: `1px solid ${color}44`,
            borderLeft: `3px solid ${color}`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Quote size={14} color={color} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'var(--color-text)',
                lineHeight: 1.6,
                fontStyle: 'italic',
                fontFamily: "'Lora', var(--font-serif)",
              }}
            >
              {book.quotes[quoteIdx]}
            </p>
          </div>
          <p style={{ margin: '6px 0 0 22px', fontSize: 11, color: 'var(--color-text-faint)' }}>
            Tap for next quote ({quoteIdx + 1}/{book.quotes.length})
          </p>
        </button>

        {/* Goodreads link */}
        <a
          href={book.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => vibrate([6])}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 0',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-accent)',
            color: 'var(--color-accent-text)',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          View on Goodreads
          <ExternalLink size={14} aria-hidden />
        </a>
      </div>
    </BottomSheet>
  );
}

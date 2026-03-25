'use client';

// Stage 4B — BookSheet with quote chips + full-screen quote view

import React, { useState } from 'react';
import { ExternalLink, BookOpen, X, Quote } from 'lucide-react';
import { BottomSheet } from '../shared-ui/BottomSheet';
import { vibrate } from '../shared-ui/haptics';
import type { Book } from '../../lib/discover/books';

// ---------------------------------------------------------------------------
// Genre → accent color (kept here for BooksRow re-use via export)
// ---------------------------------------------------------------------------

export const GENRE_COLORS: Record<string, string> = {
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

export function genreColor(genre: string, fallback?: string): string {
  return GENRE_COLORS[genre] ?? fallback ?? 'var(--color-accent)';
}

// ---------------------------------------------------------------------------
// Full-screen quote view (ScriptureOverlay-style)
// ---------------------------------------------------------------------------

function QuoteView({
  quote,
  bookTitle,
  author,
  color,
  onClose,
}: {
  quote: string;
  bookTitle: string;
  author: string;
  color: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-6)',
        animation: 'fadeIn 0.18s ease',
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close quote"
        style={{
          position: 'absolute',
          top: 'var(--space-5)',
          right: 'var(--space-5)',
          background: 'var(--color-surface)',
          border: 'none',
          borderRadius: '50%',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
        }}
      >
        <X size={16} aria-hidden />
      </button>

      {/* Accent line */}
      <div
        style={{
          width: 48,
          height: 4,
          borderRadius: 2,
          background: color,
          marginBottom: 'var(--space-6)',
        }}
      />

      {/* Quote icon */}
      <Quote size={32} color={color} style={{ marginBottom: 'var(--space-4)', opacity: 0.6 }} aria-hidden />

      {/* Quote text */}
      <p
        style={{
          fontFamily: "'Lora', var(--font-serif)",
          fontSize: '1.2rem',
          fontStyle: 'italic',
          lineHeight: 1.65,
          color: 'var(--color-text)',
          textAlign: 'center',
          maxWidth: 340,
          margin: '0 0 var(--space-5)',
        }}
      >
        &ldquo;{quote}&rdquo;
      </p>

      {/* Attribution */}
      <p
        style={{
          fontSize: 13,
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          margin: 0,
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{author}</span>
        <br />
        <span style={{ fontStyle: 'italic', fontSize: 12 }}>{bookTitle}</span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BookSheet — BottomSheet with quotes + CTA
// ---------------------------------------------------------------------------

export function BookSheet({ book, onClose }: { book: Book; onClose: () => void }) {
  const [activeQuote, setActiveQuote] = useState<string | null>(null);
  const color = book.coverColor;

  return (
    <>
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
            margin: '0 0 var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text)',
            lineHeight: 1.6,
          }}
        >
          {book.description}
        </p>

        {/* Quote chips */}
        <p
          style={{
            margin: '0 0 var(--space-2)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          Key Quotes
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginBottom: 'var(--space-5)',
          }}
        >
          {book.quotes.map((q, i) => (
            <button
              key={i}
              onClick={() => { vibrate([6]); setActiveQuote(q); }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '10px 12px',
                background: `${color}12`,
                border: `1px solid ${color}30`,
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                textAlign: 'left',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Quote size={13} color={color} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--color-text)',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                } as React.CSSProperties}
              >
                {q}
              </span>
            </button>
          ))}
        </div>

        {/* CTA */}
        <a
          href={book.url}
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
          Open Book
          <ExternalLink size={13} aria-hidden />
        </a>
      </BottomSheet>

      {activeQuote && (
        <QuoteView
          quote={activeQuote}
          bookTitle={book.title}
          author={book.author}
          color={color}
          onClose={() => setActiveQuote(null)}
        />
      )}
    </>
  );
}

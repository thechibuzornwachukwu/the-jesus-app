'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { FaithCourses } from '../../../libs/learn/FaithCourses';
import { SermonExtractor } from '../../../libs/learn/SermonExtractor';
import type { CourseProgress } from '../../../libs/learn/types';
import { LIBRARY_BOOKS } from '../../../lib/learn/library-content';
import { useBerean } from '../../../lib/berean/context';
import { useBible } from '../../../lib/bible/context';
import { BookOpenText } from 'lucide-react';

interface LearnClientProps {
  initialProgress: CourseProgress[];
  initialBereanOpen?: boolean;
}

// ─── Inline helpers ───────────────────────────────────────────────────────────

function CrossIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="8" x2="22" y2="8" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 var(--space-3)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}
    >
      {children}
    </p>
  );
}

// ─── C4: Books Section ────────────────────────────────────────────────────────

function BooksSection() {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-3)',
        }}
      >
        <SectionLabel>Library</SectionLabel>
        <Link
          href="/library"
          style={{
            color: 'var(--color-accent)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            textDecoration: 'none',
            marginTop: -10,
          }}
        >
          See more
        </Link>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          overflowX: 'auto',
          paddingBottom: 'var(--space-2)',
          scrollbarWidth: 'none',
        }}
      >
        {LIBRARY_BOOKS.map((book) => (
          <article
            key={book.id}
            style={{
              flexShrink: 0,
              width: 160,
              minHeight: 220,
              borderRadius: 'var(--radius-xl)',
              background: book.cover.background,
              border: '1px solid var(--color-border)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 'var(--space-3)',
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.72)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                {book.author}
              </p>
              <h3
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 700,
                  color: '#f7f5f2',
                  lineHeight: 1.25,
                }}
              >
                {book.title}
              </h3>
            </div>
            <div
              style={{
                margin: 0,
                display: 'flex',
                gap: 'var(--space-2)',
              }}
            >
              <a
                href={book.filePath}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  borderRadius: 'var(--radius-full)',
                  padding: '7px 10px',
                  textDecoration: 'none',
                  border: `1px solid ${book.cover.accent}`,
                  color: book.cover.accent,
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'rgba(0,0,0,0.16)',
                }}
              >
                Open
              </a>
              <a
                href={book.filePath}
                download={book.downloadName}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  borderRadius: 'var(--radius-full)',
                  padding: '7px 10px',
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: 'rgba(255,255,255,0.88)',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'rgba(0,0,0,0.16)',
                }}
              >
                Download
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ─── C5: Berean AI Chat Card ──────────────────────────────────────────────────

function BereanSection({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      style={{
        width: '100%',
        height: 160,
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        padding: 0,
        display: 'block',
      }}
    >
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/courses/sermon-banner.png"
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      {/* Solid dark overlay  no gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,5,3,0.65)' }} />
      {/* Orange cross top-right */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: 'var(--color-accent)',
        }}
      >
        <CrossIcon />
      </div>
      {/* Text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'var(--space-5)',
          textAlign: 'left',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "'Archivo Condensed', var(--font-display)",
            fontSize: 'clamp(1.6rem, 7vw, 2rem)',
            fontWeight: 900,
            color: '#f5f7f7',
            lineHeight: 1,
            letterSpacing: '-0.01em',
          }}
        >
          Berean
        </p>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 'var(--font-size-sm)',
            color: 'rgba(245,247,247,0.7)',
          }}
        >
          Search the Scriptures
        </p>
      </div>
    </button>
  );
}

// ─── Main: LearnClient ────────────────────────────────────────────────────────

export function LearnClient({ initialProgress, initialBereanOpen = false }: LearnClientProps) {
  const [courseOpen, setCourseOpen] = React.useState(false);
  const { openBerean } = useBerean();
  const { openBible } = useBible();

  useEffect(() => {
    if (initialBereanOpen) openBerean();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBereanOpen]);

  function handleAskBerean(verse: string, reference: string) {
    openBerean(`Explain this verse: "${verse}" — ${reference}`);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Page header  hidden when a course track is open */}
      {!courseOpen && (
        <div style={{ padding: 'var(--space-6) var(--page-gutter) 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1
                style={{
                  margin: '0 0 var(--space-1)',
                  fontSize: 'var(--font-size-4xl)',
                  fontWeight: 'var(--font-weight-black)' as React.CSSProperties['fontWeight'],
                  letterSpacing: 'var(--letter-spacing-tight)',
                  color: 'var(--color-text-primary)',
                  lineHeight: 'var(--line-height-tight)',
                }}
              >
                Equip
              </h1>
              <p
                style={{
                  margin: '0 0 var(--space-5)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Push further with Biblical insights
              </p>
            </div>
            <button
              onClick={openBible}
              aria-label="Open Bible"
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: 'var(--color-surface)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-muted)',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <BookOpenText size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingTop: courseOpen ? 0 : 'var(--space-5)',
          paddingLeft: 'var(--page-gutter)',
          paddingRight: 'var(--page-gutter)',
          paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + var(--space-6))',
        }}
      >
        {/* Faith Courses  always rendered; manages its own track detail */}
        <FaithCourses
          initialProgress={initialProgress}
          onCourseSelected={setCourseOpen}
          onAskBerean={handleAskBerean}
        />

        {/* Below-courses sections  hidden while a track is open */}
        {!courseOpen && (
          <>
            {/* Sermon Notes */}
            <div style={{ marginTop: 'var(--space-8)' }}>
              <SectionLabel>Sermon Notes</SectionLabel>
              <SermonExtractor />
            </div>

            {/* Library */}
            <div style={{ marginTop: 'var(--space-8)' }}>
              <BooksSection />
            </div>

            {/* Berean AI Chat */}
            <div style={{ marginTop: 'var(--space-8)' }}>
              <BereanSection onOpen={() => openBerean()} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

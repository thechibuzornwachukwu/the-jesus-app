'use client';

import React, { useState } from 'react';
import { FaithCourses } from '../../../libs/learn/FaithCourses';
import { SermonExtractor } from '../../../libs/learn/SermonExtractor';
import { SpiritualGuide } from '../../../libs/learn/SpiritualGuide';
import type { CourseProgress } from '../../../libs/learn/types';
import { showToast } from '../../../libs/shared-ui';

interface LearnClientProps {
  initialProgress: CourseProgress[];
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
  const BOOK_COUNT = 3;

  function handleBookTap() {
    showToast('Coming soon  open-source books arriving.');
  }

  return (
    <div>
      <SectionLabel>Library</SectionLabel>
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          overflowX: 'auto',
          paddingBottom: 'var(--space-2)',
          scrollbarWidth: 'none',
        }}
      >
        {Array.from({ length: BOOK_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={handleBookTap}
            style={{
              flexShrink: 0,
              width: 160,
              height: 220,
              borderRadius: 'var(--radius-xl)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              padding: 0,
            }}
          >
            {/* Faint cross watermark with radial vignette */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)',
                maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)',
              }}
            >
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                style={{ color: 'var(--color-text-primary)', opacity: 0.07 }}
              >
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="8" x2="22" y2="8" />
              </svg>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-faint)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              Coming Soon
            </p>
          </button>
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

export function LearnClient({ initialProgress }: LearnClientProps) {
  const [courseOpen, setCourseOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

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
        <div style={{ padding: 'var(--space-6) var(--space-6) 0', flexShrink: 0 }}>
          <h1
            style={{
              fontFamily: "'Archivo Condensed', var(--font-display)",
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
      )}

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingTop: courseOpen ? 0 : 'var(--space-5)',
          paddingLeft: 'var(--space-6)',
          paddingRight: 'var(--space-6)',
          paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 72px)',
        }}
      >
        {/* Faith Courses  always rendered; manages its own track detail */}
        <FaithCourses
          initialProgress={initialProgress}
          onCourseSelected={setCourseOpen}
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
              <BereanSection onOpen={() => setChatOpen(true)} />
            </div>
          </>
        )}
      </div>

      {/* Floating AI Guide  FAB + modal; modal also controlled externally by BereanSection */}
      <SpiritualGuide
        externalOpen={chatOpen}
        onExternalClose={() => setChatOpen(false)}
      />
    </div>
  );
}

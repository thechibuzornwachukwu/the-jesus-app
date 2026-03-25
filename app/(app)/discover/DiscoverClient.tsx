'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { TrendingTags } from '../../../libs/discover/TrendingTags';
import { YourVerses } from '../../../libs/discover/YourVerses';
import { PeopleRow } from '../../../libs/discover/PeopleRow';
import { CoursesRow } from '../../../libs/discover/CoursesRow';
import { BooksRow } from '../../../libs/discover/BooksRow';
import { SearchOverlay } from '../../../libs/discover/SearchOverlay';
import type { ProfileSummary } from '../../../libs/profile/types';
import type { TrendingVerse, CourseResult } from '../../../lib/discover/actions';
import type { Book } from '../../../lib/discover/books';
import type { CourseProgress } from '../../../libs/learn/types';

interface DiscoverClientProps {
  trendingVerses: TrendingVerse[];
  suggestedPeople: ProfileSummary[];
  courseProgress: CourseProgress[];
  courses: CourseResult[];
  books: Book[];
}

export function DiscoverClient({
  trendingVerses,
  suggestedPeople,
  courseProgress,
  courses,
  books,
}: DiscoverClientProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Sticky header ── */}
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
          gap: 'var(--space-2)',
        }}
      >
        <h1
          style={{
            flex: 1,
            margin: 0,
            fontFamily: "'Archivo Condensed', var(--font-display)",
            fontSize: '1.6rem',
            fontWeight: 900,
            letterSpacing: '-0.01em',
            color: 'var(--color-text)',
            lineHeight: 1,
          }}
        >
          Discover
        </h1>
      </div>

      {/* ── Search bar trigger ── */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-bg)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border)',
            padding: '0 14px',
            height: 40,
            cursor: 'pointer',
            textAlign: 'left',
            WebkitTapHighlightColor: 'transparent',
            transition: 'border-color 0.15s',
          }}
        >
          <Search size={16} color="var(--color-text-muted)" aria-hidden />
          <span style={{ flex: 1, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Search people, verses, courses…
          </span>
        </button>
      </div>

      {/* ── Scrollable home sections ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            paddingBottom: 'var(--space-6)',
          }}
        >
          <YourVerses />
          <TrendingTags verses={trendingVerses} />
          <PeopleRow
            people={suggestedPeople}
            onSeeAll={() => setSearchOpen(true)}
          />
          <CoursesRow courses={courses} progress={courseProgress} />
          <BooksRow books={books} />
        </div>
      </div>

      {/* ── Search overlay ── */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

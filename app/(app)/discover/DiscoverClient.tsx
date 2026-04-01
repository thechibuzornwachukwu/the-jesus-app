'use client';

// Stage 4A — Hero search bar + filter chips (Videos · Testimonies · People · Scripture)

import React, { useState } from 'react';
import { Search, Video, MessageSquareText, Users, BookMarked } from 'lucide-react';
import { vibrate } from '../../../libs/shared-ui/haptics';
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
import type { SearchTab } from '../../../libs/discover/SearchResults';

interface DiscoverClientProps {
  trendingVerses: TrendingVerse[];
  suggestedPeople: ProfileSummary[];
  courseProgress: CourseProgress[];
  courses: CourseResult[];
  books: Book[];
}

const FILTER_CHIPS: { key: SearchTab; label: string; icon: React.ReactNode }[] = [
  { key: 'videos', label: 'Videos', icon: <Video size={14} aria-hidden /> },
  { key: 'testimonies', label: 'Testimonies', icon: <MessageSquareText size={14} aria-hidden /> },
  { key: 'people', label: 'People', icon: <Users size={14} aria-hidden /> },
  { key: 'scripture', label: 'Scripture', icon: <BookMarked size={14} aria-hidden /> },
];

export function DiscoverClient({
  trendingVerses,
  suggestedPeople,
  courseProgress,
  courses,
  books,
}: DiscoverClientProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchType, setSearchType] = useState<SearchTab>('all');

  function openSearch(type: SearchTab = 'all') {
    vibrate([6]);
    setSearchType(type);
    setSearchOpen(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Sticky header ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        {/* Title row */}
        <div
          style={{
            height: 52,
            display: 'flex',
            alignItems: 'center',
            padding: '0 var(--space-4)',
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

        {/* Hero search bar */}
        <div style={{ padding: '0 var(--space-4) var(--space-3)' }}>
          <button
            onClick={() => openSearch('all')}
            aria-label="Open search"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
              padding: '0 16px',
              height: 44,
              cursor: 'pointer',
              textAlign: 'left',
              WebkitTapHighlightColor: 'transparent',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-accent)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'; }}
          >
            <Search size={16} color="var(--color-text-muted)" aria-hidden />
            <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text-muted)' }}>
              Search videos, people, scripture…
            </span>
          </button>
        </div>

        {/* Filter chips */}
        <div
          className="hide-scrollbar"
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingLeft: 'var(--space-4)',
            paddingRight: 'var(--space-4)',
            paddingBottom: 'var(--space-3)',
          }}
        >
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              onClick={() => openSearch(chip.key)}
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.12s, border-color 0.12s, color 0.12s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-soft)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-accent)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-accent)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text)';
              }}
            >
              {chip.icon}
              {chip.label}
            </button>
          ))}
        </div>
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
            onSeeAll={() => openSearch('people')}
          />
          <CoursesRow courses={courses} progress={courseProgress} />
          <BooksRow books={books} />
        </div>
      </div>

      {/* ── Search overlay ── */}
      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          initialType={searchType}
        />
      )}
    </div>
  );
}

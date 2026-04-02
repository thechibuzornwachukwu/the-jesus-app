'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { vibrate } from '../../../libs/shared-ui/haptics';
import { TrendingTags } from '../../../libs/discover/TrendingTags';
import { YourVerses } from '../../../libs/discover/YourVerses';
import { PeopleRow } from '../../../libs/discover/PeopleRow';
import { SearchOverlay } from '../../../libs/discover/SearchOverlay';
import type { ProfileSummary } from '../../../libs/profile/types';
import type { TrendingVerse } from '../../../lib/discover/actions';
import type { SearchTab } from '../../../libs/discover/SearchResults';

interface DiscoverClientProps {
  trendingVerses: TrendingVerse[];
  suggestedPeople: ProfileSummary[];
}

export function DiscoverClient({
  trendingVerses,
  suggestedPeople,
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

      {/* Sticky header */}
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

          {/* Search icon button (top-right) */}
          <button
            onClick={() => openSearch('all')}
            aria-label="Search"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-soft)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-accent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'none';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
            }}
          >
            <Search size={20} aria-hidden />
          </button>
        </div>
      </div>

      {/* Scrollable home sections */}
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
          <PeopleRow
            people={suggestedPeople}
            onSeeAll={() => openSearch('people')}
          />
          <TrendingTags verses={trendingVerses} />
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          initialType={searchType}
        />
      )}
    </div>
  );
}

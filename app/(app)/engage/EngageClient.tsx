'use client';

import React, { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import { Search, Plus, Users } from 'lucide-react';
import { CellCard } from '../../../libs/cells/CellCard';
import { CreateCellSheet } from '../../../libs/cells/CreateCellSheet';
import { SwipeToAction } from '../../../libs/cells/SwipeToAction';
import { ChipGroup, SectionHeader, EmptyState } from '../../../libs/shared-ui';
import type { CellWithPreview } from '../../../lib/cells/types';
import { getDiscoverCellsWithActivityMatch } from '../../../lib/cells/actions';
import { getActivityMatchScore } from '../../../lib/cells/notification-scoring';

const CATEGORIES = ['For You', 'All', 'Prayer', 'Bible Study', 'Youth', 'Worship', 'Discipleship', 'General'];

interface EngageClientProps {
  myCells: CellWithPreview[];
  discoverCells: CellWithPreview[];
  currentUserId: string;
  userCategories: string[];
}

export function EngageClient({
  myCells,
  discoverCells,
  currentUserId: _currentUserId,
  userCategories,
}: EngageClientProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set(myCells.map((c) => c.id)));
  const [localMyCells, setLocalMyCells] = useState<CellWithPreview[]>(myCells);
  const [forYouCells, setForYouCells] = useState<CellWithPreview[] | null>(null);
  const [forYouLoading, setForYouLoading] = useState(false);
  const [, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchToggle = () => {
    setSearchOpen((prev) => {
      if (!prev) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else {
        setSearch('');
      }
      return !prev;
    });
  };

  const handleCategoryChange = (v: string | string[]) => {
    const next = v as string;
    setCategoryFilter(next);
    if (next === 'For You' && forYouCells === null && !forYouLoading) {
      setForYouLoading(true);
      startTransition(() => {
        getDiscoverCellsWithActivityMatch(userCategories, [...joinedIds]).then((cells) => {
          const sorted = [...cells].sort(
            (a, b) => getActivityMatchScore(b, userCategories) - getActivityMatchScore(a, userCategories)
          );
          setForYouCells(sorted);
          setForYouLoading(false);
        });
      });
    }
  };

  const filteredDiscover =
    categoryFilter === 'For You'
      ? (forYouCells ?? []).filter((c) => {
          if (search) {
            const q = search.toLowerCase();
            return (
              c.name.toLowerCase().includes(q) ||
              (c.description?.toLowerCase().includes(q) ?? false)
            );
          }
          return true;
        })
      : discoverCells.filter((c) => {
          if (joinedIds.has(c.id)) return false;
          if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
          if (search) {
            const q = search.toLowerCase();
            if (!c.name.toLowerCase().includes(q) && !(c.description?.toLowerCase().includes(q) ?? false))
              return false;
          }
          return true;
        });

  const [featuredCell, ...gridCells] = filteredDiscover;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Stage 5.1 Hero ── */}
      <div style={{ position: 'relative', height: 200, flexShrink: 0, overflow: 'hidden' }}>
        <Image
          src="/engage-hero.png"
          alt="Community"
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
          sizes="100vw"
        />
        {/* gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'var(--gradient-hero)',
          }}
        />

        {/* top action bar (search + create) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 var(--space-4)',
            gap: 'var(--space-2)',
          }}
        >
          <button
            onClick={handleSearchToggle}
            aria-label="Search cells"
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: searchOpen ? 'var(--color-accent)' : 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(6px)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-bright)',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
          >
            <Search size={17} />
          </button>

          <button
            onClick={() => setCreateOpen(true)}
            aria-label="Create a new cell"
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: 'var(--color-accent)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent-text)',
              flexShrink: 0,
            }}
          >
            <Plus size={18} />
          </button>
        </div>

        {/* hero text */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 'var(--space-4)',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: "'Archivo Condensed', var(--font-display)",
              fontSize: 'clamp(2.4rem, 10vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: '#f5f7f7',
              lineHeight: 1,
              textShadow: '0 2px 12px rgba(4,5,3,0.6)',
            }}
          >
            Engage
          </h1>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 'var(--font-size-sm)',
              color: 'rgba(245,247,247,0.75)',
              fontWeight: 'var(--font-weight-medium)',
              letterSpacing: '0.01em',
            }}
          >
            Find your people. Go deeper.
          </p>
        </div>
      </div>

      {/* Inline search bar */}
      {searchOpen && (
        <div
          style={{
            padding: 'var(--space-2) var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            flexShrink: 0,
          }}
        >
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cells…"
            style={{
              width: '100%',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: 'var(--space-2) var(--space-4)',
              color: 'var(--color-text)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4) 0 var(--space-6)' }}>

        {/* ── Stage 5.2 Your Communities ── */}
        <section style={{ marginBottom: 'var(--space-5)', padding: '0 var(--space-4)' }}>
          <SectionHeader>Your Communities</SectionHeader>
          {localMyCells.length === 0 ? (
            <EmptyState
              message="Every revival starts with a room. Create your first cell and call your people in."
              imageSrc="/engage-hero.png"
            />
          ) : (
            <div className="stagger-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {localMyCells.map((cell) => (
                <SwipeToAction
                  key={cell.id}
                  onLeave={() => {
                    setJoinedIds((p) => { const n = new Set(p); n.delete(cell.id); return n; });
                    setLocalMyCells((p) => p.filter((c) => c.id !== cell.id));
                  }}
                >
                  {/* online badge wrapper */}
                  <div style={{ position: 'relative' }}>
                    <CellCard cell={cell} isMember />
                    {/* online member count badge */}
                    {typeof (cell as CellWithPreview & { online_count?: number }).online_count === 'number' &&
                      (cell as CellWithPreview & { online_count?: number }).online_count! > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          background: 'rgba(4,5,3,0.72)',
                          backdropFilter: 'blur(4px)',
                          borderRadius: 'var(--radius-full)',
                          padding: '2px 8px 2px 6px',
                          pointerEvents: 'none',
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: 'var(--color-success)',
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#f5f7f7',
                            lineHeight: 1,
                          }}
                        >
                          {(cell as CellWithPreview & { online_count?: number }).online_count}
                        </span>
                      </div>
                    )}
                  </div>
                </SwipeToAction>
              ))}
            </div>
          )}
        </section>

        <div
          style={{
            height: 1,
            background: 'var(--color-border)',
            margin: '0 var(--space-4) var(--space-5)',
          }}
        />

        {/* ── Stage 5.3 Discover ── */}
        <section style={{ padding: '0 var(--space-4)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-1)',
            }}
          >
            <SectionHeader>Discover</SectionHeader>
            <button
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-accent)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Browse all
            </button>
          </div>

          {/* reordered chips: Prayer first */}
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <ChipGroup
              options={CATEGORIES}
              value={categoryFilter}
              onChange={handleCategoryChange}
              mode="single"
              scrollable
            />
          </div>

          {categoryFilter === 'For You' && forYouLoading ? (
            <EmptyState message="Finding cells for you…" />
          ) : filteredDiscover.length === 0 ? (
            /* warm empty state */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-8) var(--space-4)',
                textAlign: 'center',
              }}
            >
              {/* inline cross icon */}
              <svg width={36} height={36} viewBox="0 0 36 36" fill="none" aria-hidden>
                <rect x={15} y={4} width={6} height={28} rx={3} fill="var(--color-accent)" />
                <rect x={4} y={13} width={28} height={6} rx={3} fill="var(--color-accent)" />
              </svg>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 'var(--line-height-relaxed)' }}>
                {categoryFilter === 'For You'
                  ? 'No matching cells found. Update your interests in Profile → Settings.'
                  : search || categoryFilter !== 'All'
                  ? 'No cells match your filter — try a different category.'
                  : 'No public cells yet. Be the first to create a community!'}
              </p>
            </div>
          ) : (
            <>
              {/* Featured — full-width card with brand photo background */}
              <div style={{ marginBottom: 'var(--space-3)', position: 'relative' }}>
                <div
                  style={{
                    position: 'relative',
                    borderRadius: 'var(--radius-xl)',
                    overflow: 'hidden',
                  }}
                >
                  {/* background photo */}
                  <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    <Image
                      src="/engage-discover.png"
                      alt=""
                      fill
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                      sizes="100vw"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'var(--gradient-card-overlay)',
                      }}
                    />
                  </div>
                  {/* card content on top */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <CellCard cell={featuredCell} isMember={false} featured />
                  </div>
                </div>
              </div>

              {/* Grid — 2 columns with stagger animation */}
              {gridCells.length > 0 && (
                <div
                  className="stagger-list"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--space-3)',
                  }}
                >
                  {gridCells.map((cell) => (
                    <CellCard key={cell.id} cell={cell} isMember={false} />
                  ))}
                </div>
              )}

              {/* member count hint */}
              {filteredDiscover.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginTop: 'var(--space-4)',
                    justifyContent: 'center',
                  }}
                >
                  <Users size={13} color="var(--color-text-faint)" />
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-faint)' }}>
                    {filteredDiscover.length} {filteredDiscover.length === 1 ? 'community' : 'communities'} available
                  </span>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <CreateCellSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

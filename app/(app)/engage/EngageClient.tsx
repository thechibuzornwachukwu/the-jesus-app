'use client';

import React, { useState, useRef } from 'react';
import { Search, Plus } from 'lucide-react';
import { CellCard } from '../../../libs/cells/CellCard';
import { CreateCellSheet } from '../../../libs/cells/CreateCellSheet';
import { SwipeToAction } from '../../../libs/cells/SwipeToAction';
import { ChipGroup, SectionHeader, EmptyState } from '../../../libs/shared-ui';
import type { CellWithPreview } from '../../../lib/cells/types';

const CATEGORIES = ['All', 'Prayer', 'Bible Study', 'Youth', 'Worship', 'Discipleship', 'General'];

interface EngageClientProps {
  myCells: CellWithPreview[];
  discoverCells: CellWithPreview[];
  currentUserId: string;
}

export function EngageClient({ myCells, discoverCells, currentUserId: _currentUserId }: EngageClientProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set(myCells.map((c) => c.id)));
  const [localMyCells, setLocalMyCells] = useState<CellWithPreview[]>(myCells);
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

  const filteredDiscover = discoverCells.filter((c) => {
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
      {/* Fixed header bar */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-4)',
          gap: 'var(--space-2)',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontFamily: "'Archivo Condensed', var(--font-display)",
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 900,
            letterSpacing: 'var(--letter-spacing-tight)',
            color: 'var(--color-accent)',
            flex: 1,
            lineHeight: 1,
            margin: 0,
          }}
        >
          Engage
        </h1>

        <button
          onClick={handleSearchToggle}
          aria-label="Search cells"
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: searchOpen ? 'var(--color-accent-soft)' : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: searchOpen ? 'var(--color-accent)' : 'var(--color-text-muted)',
            transition: 'background 0.15s, color 0.15s',
            flexShrink: 0,
          }}
        >
          <Search size={18} />
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
            }}
          />
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3) 0 var(--space-6)' }}>
        {/* My Cells */}
        <section style={{ marginBottom: 'var(--space-5)', padding: '0 var(--space-4)' }}>
          <SectionHeader>My Cells</SectionHeader>
          {localMyCells.length === 0 ? (
            <EmptyState message="No cells yet — start one!" />
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
                  <CellCard cell={cell} isMember />
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

        {/* Discover */}
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

          <div style={{ marginBottom: 'var(--space-3)' }}>
            <ChipGroup
              options={CATEGORIES}
              value={categoryFilter}
              onChange={(v) => setCategoryFilter(v as string)}
              mode="single"
              scrollable
            />
          </div>

          {filteredDiscover.length === 0 ? (
            <EmptyState
              message={
                search || categoryFilter !== 'All'
                  ? 'No cells match your filter.'
                  : 'No public cells yet. Be the first to create one!'
              }
            />
          ) : (
            <>
              {/* Featured — full-width */}
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <CellCard cell={featuredCell} isMember={false} featured />
              </div>

              {/* Grid — 2 columns */}
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
            </>
          )}
        </section>
      </div>

      <CreateCellSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

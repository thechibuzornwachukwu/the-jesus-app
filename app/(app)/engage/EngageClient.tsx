'use client';

import React, { useState, useRef, useTransition } from 'react';
import { Search, Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar } from '../../../libs/shared-ui/Avatar';
import { CreateCellSheet } from '../../../libs/cells/CreateCellSheet';
import { SwipeToAction } from '../../../libs/cells/SwipeToAction';
import { StoriesStrip } from '../../../libs/cells/StoriesStrip';
import { ChipGroup, SectionHeader, EmptyState } from '../../../libs/shared-ui';
import { CellCard } from '../../../libs/cells/CellCard';
import type { CellWithPreview } from '../../../lib/cells/types';
import type { CellStoryGroup } from '../../../lib/cells/types';
import { getDiscoverCellsWithActivityMatch } from '../../../lib/cells/actions';
import { getActivityMatchScore } from '../../../lib/cells/notification-scoring';
import { vibrate } from '../../../libs/shared-ui/haptics';

const CATEGORIES = ['For You', 'All', 'Prayer', 'Bible Study', 'Youth', 'Worship', 'Discipleship', 'General'];

function relativeTime(ts: string | null | undefined): string {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function lastMessagePreview(
  lastMsg: { content: string | null; message_type: string } | null | undefined
): string {
  if (!lastMsg) return 'No messages yet';
  if (lastMsg.message_type === 'audio') return '🎤 Voice message';
  if (lastMsg.message_type === 'image') return '📷 Image';
  if (lastMsg.content) return lastMsg.content;
  return '';
}

interface CommunityRowProps {
  cell: CellWithPreview;
  lastMsg?: { content: string | null; message_type: string; created_at: string } | null;
  onLeave: () => void;
}

function CommunityRow({ cell, lastMsg, onLeave }: CommunityRowProps) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    vibrate([8]);
    router.push(`/engage/${cell.slug}`);
  };

  return (
    <SwipeToAction onLeave={onLeave}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        onTouchCancel={() => setPressed(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          background: pressed ? 'var(--color-surface)' : 'transparent',
          cursor: 'pointer',
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
          transform: pressed ? 'scale(0.98)' : 'scale(1)',
          transition: 'background 0.12s, transform 0.1s',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            border: '2px solid var(--color-border)',
          }}
        >
          <Avatar src={cell.avatar_url} name={cell.name} size={48} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {cell.name}
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 12,
              color: 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {lastMessagePreview(lastMsg)}
          </p>
        </div>

        {/* Right: time + badge */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>
            {relativeTime(lastMsg?.created_at ?? cell.last_activity)}
          </span>
          {/* unread badge placeholder  will be driven by DB count */}
          {(cell.unread_count ?? 0) > 0 && (
            <div
              style={{
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-accent-text)' }}>
                {cell.unread_count}
              </span>
            </div>
          )}
        </div>
      </div>
    </SwipeToAction>
  );
}

interface EngageClientProps {
  myCells: CellWithPreview[];
  discoverCells: CellWithPreview[];
  currentUserId: string;
  userCategories: string[];
  lastMessages: Record<string, { content: string | null; message_type: string; created_at: string } | null>;
  storyGroups: CellStoryGroup[];
}

export function EngageClient({
  myCells,
  discoverCells,
  currentUserId: _currentUserId,
  userCategories,
  lastMessages,
  storyGroups,
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
      if (!prev) setTimeout(() => searchInputRef.current?.focus(), 50);
      else setSearch('');
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
          if (!search) return true;
          const q = search.toLowerCase();
          return c.name.toLowerCase().includes(q) || (c.description?.toLowerCase().includes(q) ?? false);
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
            background: searchOpen ? 'var(--color-accent)' : 'var(--color-surface)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: searchOpen ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
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
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── Stories strip ── */}
        {storyGroups.length > 0 && (
          <StoriesStrip groups={storyGroups} />
        )}

        {/* ── Your Communities ── */}
        {localMyCells.length > 0 && (
          <section style={{ marginBottom: 'var(--space-2)' }}>
            <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-1)' }}>
              <SectionHeader>Your Communities</SectionHeader>
            </div>
            {localMyCells.map((cell) => (
              <CommunityRow
                key={cell.id}
                cell={cell}
                lastMsg={lastMessages[cell.id]}
                onLeave={() => {
                  setJoinedIds((p) => { const n = new Set(p); n.delete(cell.id); return n; });
                  setLocalMyCells((p) => p.filter((c) => c.id !== cell.id));
                }}
              />
            ))}
          </section>
        )}

        {localMyCells.length === 0 && (
          <section style={{ padding: 'var(--space-4)' }}>
            <EmptyState
              message="Every revival starts with a room. Create your first cell and call your people in."
              imageSrc="/engage-hero.png"
            />
          </section>
        )}

        <div style={{ height: 1, background: 'var(--color-border)', margin: '0 var(--space-4) var(--space-4)' }} />

        {/* ── Discover ── */}
        <section style={{ padding: '0 var(--space-4) var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
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
              onChange={handleCategoryChange}
              mode="single"
              scrollable
            />
          </div>

          {categoryFilter === 'For You' && forYouLoading ? (
            <EmptyState message="Finding cells for you…" />
          ) : filteredDiscover.length === 0 ? (
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
              <svg width={36} height={36} viewBox="0 0 36 36" fill="none" aria-hidden>
                <rect x={15} y={4} width={6} height={28} rx={3} fill="var(--color-accent)" />
                <rect x={4} y={13} width={28} height={6} rx={3} fill="var(--color-accent)" />
              </svg>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 'var(--line-height-relaxed)' }}>
                {categoryFilter === 'For You'
                  ? 'No matching cells found. Update your interests in Profile → Settings.'
                  : search || categoryFilter !== 'All'
                  ? 'No cells match your filter  try a different category.'
                  : 'No public cells yet. Be the first to create a community!'}
              </p>
            </div>
          ) : (
            <>
              {/* Full-width photo cards */}
              <div className="stagger-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {filteredDiscover.map((cell) => (
                  <CellCard key={cell.id} cell={cell} isMember={false} featured />
                ))}
              </div>

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

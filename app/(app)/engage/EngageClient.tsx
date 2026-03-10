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
import { DailyVerse } from '../../../libs/explore/DailyVerse';
import type { CellWithPreview } from '../../../lib/cells/types';
import type { CellStoryGroup } from '../../../lib/cells/types';
import type { DailyVerseType } from '../../../lib/explore/types';
import { getDiscoverCellsWithActivityMatch } from '../../../lib/cells/actions';
import { vibrate } from '../../../libs/shared-ui/haptics';
import { PullToRefresh } from '../../../libs/shared-ui/PullToRefresh';

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
  defaultChannelId?: string;
}

function CommunityRow({ cell, lastMsg, onLeave, defaultChannelId }: CommunityRowProps) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    vibrate([8]);
    router.push(
      defaultChannelId
        ? `/engage/${cell.slug}/${defaultChannelId}`
        : `/engage/${cell.slug}`
    );
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
          gap: 14,
          padding: '13px 16px',
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
            width: 50,
            height: 50,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            border: '2px solid var(--color-border)',
          }}
        >
          <Avatar src={cell.avatar_url} name={cell.name} size={50} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.9375rem',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.01em',
            }}
          >
            {cell.name}
          </p>
          <p
            style={{
              margin: '3px 0 0',
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
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
  defaultChannelIds: Record<string, string>;
  verse: DailyVerseType;
  verseEngagement: { likeCount: number; commentCount: number; userLiked: boolean };
}

export function EngageClient({
  myCells,
  discoverCells,
  currentUserId: _currentUserId,
  userCategories,
  lastMessages,
  storyGroups,
  defaultChannelIds,
  verse,
  verseEngagement,
}: EngageClientProps) {
  const router = useRouter();
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
          setForYouCells(cells);
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

  const featuredDiscover = filteredDiscover.filter((c) => c.is_featured).slice(0, 3);
  const featuredIds = new Set(featuredDiscover.map((c) => c.id));
  const regularDiscover = filteredDiscover.filter((c) => !featuredIds.has(c.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Sticky header (D2: safe-area top) ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          height: 'calc(52px + var(--safe-top))',
          display: 'flex',
          alignItems: 'flex-end',
          paddingBottom: 0,
          padding: '0 var(--space-4)',
          paddingTop: 'var(--safe-top)',
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          flexShrink: 0,
          gap: 'var(--space-2)',
        }}
      >
        <h1
          style={{
            flex: 1,
            margin: 0,
            fontFamily: "'Archivo Condensed', var(--font-display)",
            fontSize: '1.5rem',
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
            width: 34,
            height: 34,
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
          <Search size={17} />
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
            className="field-input"
            style={{
              borderRadius: 'var(--radius-full)',
              padding: 'var(--space-2) var(--space-4)',
            }}
          />
        </div>
      )}

      {/* Scrollable content — D4: pull-to-refresh */}
      <PullToRefresh
        onRefresh={async () => {
          // Re-fetch discover cells to surface new communities
          const fresh = await getDiscoverCellsWithActivityMatch(userCategories, [...joinedIds]);
          setForYouCells(fresh);
        }}
        style={{ flex: 1 }}
      >

        {/* ── Stories strip ── */}
        {storyGroups.length > 0 && (
          <StoriesStrip groups={storyGroups} />
        )}

        {/* ── Daily Verse ── */}
        <DailyVerse
          verse={verse}
          initialLikeCount={verseEngagement.likeCount}
          initialUserLiked={verseEngagement.userLiked}
          initialCommentCount={verseEngagement.commentCount}
        />

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
                defaultChannelId={defaultChannelIds[cell.id]}
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

        <div style={{ height: 8 }} />

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
              {featuredDiscover.length > 0 && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <SectionHeader>Featured</SectionHeader>
                  <div className="stagger-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                    {featuredDiscover.map((cell) => (
                      <CellCard key={`featured-${cell.id}`} cell={cell} isMember={false} featured />
                    ))}
                  </div>
                </div>
              )}

              {/* Grid on tablet+, single column on mobile */}
              <div className="stagger-list discover-grid">
                {regularDiscover.map((cell) => (
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
      </PullToRefresh>

      {/* ── FAB: Create Cell ── */}
      <button
        onClick={() => { vibrate([8]); setCreateOpen(true); }}
        aria-label="Create a new cell"
        style={{
          position: 'fixed',
          bottom: 'calc(var(--nav-height, 56px) + var(--safe-bottom, 0px) + 20px)',
          right: 20,
          zIndex: 20,
          width: 52,
          height: 52,
          borderRadius: 'var(--radius-full)',
          border: 'none',
          background: 'var(--color-accent)',
          color: 'var(--color-accent-text)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(244,117,33,0.4)',
          animation: 'fab-spring 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        <Plus size={22} />
      </button>

      <CreateCellSheet open={createOpen} onClose={() => setCreateOpen(false)} />

      <style>{`
        .discover-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        @media (min-width: 600px) {
          .discover-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-3);
          }
        }
      `}</style>
    </div>
  );
}

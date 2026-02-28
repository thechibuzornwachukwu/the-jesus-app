'use client';

import React, { useState } from 'react';
import { SavedVersesList } from './SavedVersesList';
import { JoinedCellsList } from './JoinedCellsList';
import { PostedVideoGrid } from './PostedVideoGrid';
import type { SavedVerse, JoinedCell, PostedVideo } from './types';
import { TabBar } from '../shared-ui';

const TABS = ['Saved Verses', 'My Cells', 'Videos'] as const;
type Tab = (typeof TABS)[number];

interface ContentTabsProps {
  savedVerses: SavedVerse[];
  joinedCells: JoinedCell[];
  postedVideos: PostedVideo[];
}

export function ContentTabs({ savedVerses, joinedCells, postedVideos }: ContentTabsProps) {
  const [active, setActive] = useState<Tab>('Saved Verses');

  return (
    <div>
      <TabBar
        tabs={TABS.map((t) => ({ id: t, label: t }))}
        activeId={active}
        onChange={(id) => setActive(id as Tab)}
        variant="underline"
      />

      {/* Tab content */}
      <div style={{ padding: '0 var(--space-4)' }}>
        {active === 'Saved Verses' && <SavedVersesList verses={savedVerses} />}
        {active === 'My Cells' && <JoinedCellsList cells={joinedCells} />}
        {active === 'Videos' && <PostedVideoGrid videos={postedVideos} />}
      </div>
    </div>
  );
}

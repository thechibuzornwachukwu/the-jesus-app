'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Avatar } from '../shared-ui/Avatar';
import { StoryViewer } from './StoryViewer';
import type { CellStoryGroup } from '../../lib/cells/types';

interface StoriesStripProps {
  groups: CellStoryGroup[];
  userRole?: 'admin' | 'member' | null;
  activeCellId?: string;
  onCreateStory?: () => void;
}

export function StoriesStrip({ groups, userRole, activeCellId, onCreateStory }: StoriesStripProps) {
  const router = useRouter();
  const [viewingGroup, setViewingGroup] = useState<CellStoryGroup | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);

  const handleCircleClick = (group: CellStoryGroup) => {
    if (group.stories.length > 0) {
      setViewingIndex(0);
      setViewingGroup(group);
    } else if (activeCellId) {
      // no stories  navigate to the cell
      router.push(`/engage/${group.cellSlug}`);
    }
  };

  if (groups.length === 0 && userRole !== 'admin') return null;

  return (
    <>
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          gap: 12,
          padding: '10px 16px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          flexShrink: 0,
        }}
      >
        {/* Admin "add story" button */}
        {userRole === 'admin' && onCreateStory && (
          <button
            onClick={onCreateStory}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'var(--color-surface)',
                border: '2px dashed var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={22} color="var(--color-accent)" />
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              Add story
            </span>
          </button>
        )}

        {groups.map((group) => (
          <button
            key={group.cellId}
            onClick={() => handleCircleClick(group)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                padding: 3,
                background: group.hasUnseen
                  ? 'var(--color-accent)'
                  : 'rgba(245,247,247,0.15)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid var(--color-bg)',
                }}
              >
                <Avatar src={group.cellAvatarUrl} name={group.cellName} size={54} />
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                color: group.hasUnseen ? 'var(--color-text)' : 'var(--color-text-muted)',
                maxWidth: 64,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: group.hasUnseen ? 600 : 400,
              }}
            >
              {group.cellName}
            </span>
          </button>
        ))}
      </div>

      {viewingGroup && (
        <StoryViewer
          group={viewingGroup}
          initialIndex={viewingIndex}
          onClose={() => setViewingGroup(null)}
          onCreateStory={userRole === 'admin' ? onCreateStory : undefined}
        />
      )}
    </>
  );
}

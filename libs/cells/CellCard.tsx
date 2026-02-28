'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '../shared-ui/Avatar';
import { Badge } from '../shared-ui/Badge';
import { vibrate } from '../shared-ui/haptics';
import type { Cell } from '../../lib/cells/types';

interface CellCardProps {
  cell: Cell;
  isMember: boolean;
}

export function CellCard({ cell, isMember }: CellCardProps) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    vibrate([8]);
    router.push(`/engage/${cell.slug}/info`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
      aria-label={`View ${cell.name}`}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-2) var(--space-3)',
        paddingLeft: isMember ? 'calc(var(--space-3) - 2px)' : 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        borderLeft: isMember ? '2px solid var(--color-accent)' : '2px solid transparent',
        cursor: 'pointer',
        background: pressed ? 'var(--color-surface-high)' : 'transparent',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'background 0.12s, transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)',
        outline: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Avatar — Discord rounded square */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Avatar src={cell.avatar_url} name={cell.name} size={48} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            margin: 0,
          }}
        >
          {cell.name}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-1)',
          }}
        >
          <Badge variant="default">{cell.category}</Badge>
          {cell.member_count !== undefined && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {cell.member_count} {cell.member_count === 1 ? 'member' : 'members'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

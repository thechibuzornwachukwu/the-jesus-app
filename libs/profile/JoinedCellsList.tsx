'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar } from '../shared-ui/Avatar';
import { Badge } from '../shared-ui/Badge';
import type { JoinedCell } from './types';
import { EmptyState } from '../shared-ui';

interface JoinedCellsListProps {
  cells: JoinedCell[];
}

export function JoinedCellsList({ cells }: JoinedCellsListProps) {
  if (cells.length === 0) {
    return <EmptyState message="You haven't joined any cells yet." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: 'var(--space-4) 0' }}>
      {cells.map((item) => (
        <Link
          key={item.cell.id}
          href={`/engage/${item.cell.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-2)',
            borderBottom: '1px solid var(--color-border)',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <Avatar src={item.cell.avatar_url} name={item.cell.name} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-primary)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.cell.name}
            </p>
            {item.cell.category && (
              <span style={{ marginTop: 2, display: 'inline-block' }}>
                <Badge>{item.cell.category}</Badge>
              </span>
            )}
          </div>
          <span
            style={{
              color: 'var(--color-accent)',
              fontSize: 'var(--font-size-sm)',
              flexShrink: 0,
            }}
          >
            Open →
          </span>
        </Link>
      ))}
    </div>
  );
}

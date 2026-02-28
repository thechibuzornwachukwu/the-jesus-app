'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar } from '../shared-ui/Avatar';
import { Badge } from '../shared-ui/Badge';
import type { JoinedCell } from './types';
import { EmptyState } from '../shared-ui';
import { Users } from 'lucide-react';

interface JoinedCellsListProps {
  cells: JoinedCell[];
}

// Deterministic gradient per cell name
function gradientFor(name: string) {
  const hue = (name.charCodeAt(0) * 37 + name.charCodeAt(name.length - 1) * 13) % 360;
  return `linear-gradient(135deg, hsl(${hue},55%,22%), hsl(${(hue + 40) % 360},65%,35%))`;
}

export function JoinedCellsList({ cells }: JoinedCellsListProps) {
  if (cells.length === 0) {
    return (
      <EmptyState
        icon={<Users size={40} />}
        message="No fellowships joined yet — browse cells in the Engage tab and find your community."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4) 0' }}>
      {cells.map((item) => {
        const dest = item.cell.slug ? `/engage/${item.cell.slug}` : `/engage/${item.cell.id}`;

        return (
          <Link
            key={item.cell.id}
            href={dest}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
              }}
            >
              {/* Banner */}
              <div
                style={{
                  height: 64,
                  position: 'relative',
                  background: item.cell.banner_url ? undefined : gradientFor(item.cell.name),
                  overflow: 'hidden',
                }}
              >
                {item.cell.banner_url && (
                  <Image
                    src={item.cell.banner_url}
                    alt=""
                    fill
                    sizes="100vw"
                    style={{ objectFit: 'cover' }}
                  />
                )}
              </div>

              {/* Info row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  marginTop: -20,
                }}
              >
                <div style={{ flexShrink: 0, borderRadius: 'var(--radius-full)', border: '2px solid var(--color-bg)', overflow: 'hidden' }}>
                  <Avatar src={item.cell.avatar_url} name={item.cell.name} size={40} />
                </div>
                <div style={{ flex: 1, minWidth: 0, marginTop: 20 }}>
                  <p
                    style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-base)',
                      color: 'var(--color-text)',
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
                {item.role === 'admin' && (
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-accent)',
                      fontWeight: 'var(--font-weight-semibold)',
                      flexShrink: 0,
                      marginTop: 20,
                    }}
                  >
                    Admin
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

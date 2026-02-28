'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '../shared-ui/Avatar';
import { Badge } from '../shared-ui/Badge';
import { vibrate } from '../shared-ui/haptics';
import type { CellWithPreview, MemberPreview } from '../../lib/cells/types';

function relativeTime(ts: string | null): string {
  if (!ts) return 'New';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 5) return 'Active just now';
  if (mins < 60) return `Active ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Active ${hrs}h ago`;
  return `Active ${Math.floor(hrs / 24)}d ago`;
}

function FaintCross() {
  return (
    <svg
      style={{ position: 'absolute', right: 12, bottom: 8, opacity: 0.08 }}
      width={48}
      height={56}
      viewBox="0 0 48 56"
      fill="none"
      aria-hidden
    >
      <rect x={16} y={0} width={16} height={56} rx={4} fill="white" />
      <rect x={0} y={14} width={48} height={16} rx={4} fill="white" />
    </svg>
  );
}

function AvatarStack({ members }: { members: MemberPreview[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {members.slice(0, 3).map((m, i) => (
        <div
          key={i}
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: '2px solid var(--color-surface)',
            overflow: 'hidden',
            marginLeft: i === 0 ? 0 : -6,
            flexShrink: 0,
          }}
        >
          <Avatar src={m.avatar_url} name={m.username} size={22} />
        </div>
      ))}
    </div>
  );
}

interface CellCardProps {
  cell: CellWithPreview;
  isMember: boolean;
  featured?: boolean;
}

export function CellCard({ cell, isMember, featured }: CellCardProps) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    vibrate([8]);
    router.push(`/engage/${cell.slug}/info`);
  };

  const bannerHeight = featured ? 120 : 80;
  const descLines = featured ? 2 : 1;

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
        borderRadius: 'var(--radius-md)',
        borderLeft: isMember ? '2px solid var(--color-accent)' : '2px solid transparent',
        cursor: 'pointer',
        background: pressed ? 'var(--color-surface-high)' : 'var(--color-surface)',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'background 0.12s, transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)',
        outline: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* Banner */}
      <div
        style={{
          height: bannerHeight,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, var(--color-surface-high) 0%, var(--color-sidebar) 100%)',
        }}
      >
        {cell.banner_url ? (
          <img
            src={cell.banner_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <FaintCross />
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 'var(--space-2) var(--space-3) var(--space-3)' }}>
        {/* Avatar + meta row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              overflow: 'hidden',
              flexShrink: 0,
              border: '2px solid var(--color-bg)',
              marginTop: -22,
            }}
          >
            <Avatar src={cell.avatar_url} name={cell.name} size={36} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {cell.name}
            </p>
            <div style={{ marginTop: 3 }}>
              <Badge variant="default">{cell.category}</Badge>
            </div>
            {cell.description && (
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  margin: 'var(--space-1) 0 0',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: descLines,
                  WebkitBoxOrient: 'vertical' as const,
                }}
              >
                {cell.description}
              </p>
            )}
          </div>
        </div>

        {/* Footer: avatar stack + member overflow + activity */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-2)',
          }}
        >
          {cell.member_preview.length > 0 && (
            <>
              <AvatarStack members={cell.member_preview} />
              {(cell.member_count ?? 0) > 3 && (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent)', fontWeight: 'var(--font-weight-semibold)' }}>
                  +{(cell.member_count ?? 0) - 3}
                </span>
              )}
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-faint)' }}>
                ·
              </span>
            </>
          )}
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-faint)',
              marginLeft: 'auto',
            }}
          >
            {relativeTime(cell.last_activity)}
          </span>
        </div>
      </div>
    </div>
  );
}

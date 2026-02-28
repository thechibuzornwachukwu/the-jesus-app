'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Avatar } from '../shared-ui/Avatar';
import type { CellMemberWithProfile } from '../../lib/cells/types';

interface OnlineUsersPanelProps {
  members: CellMemberWithProfile[];
  onlineMemberIds: Set<string>;
  currentUserId: string;
  collapsed: boolean;
  onToggle: () => void;
}

type StatusGroup = 'online' | 'idle' | 'offline';

function getStatus(userId: string, onlineIds: Set<string>, onlineAtMap: Map<string, number>): StatusGroup {
  if (!onlineIds.has(userId)) return 'offline';
  const onlineAt = onlineAtMap.get(userId);
  if (onlineAt && Date.now() - onlineAt > 5 * 60 * 1000) return 'idle';
  return 'online';
}

const STATUS_DOT: Record<StatusGroup, string> = {
  online: 'var(--color-online)',
  idle: 'var(--color-idle)',
  offline: 'var(--color-offline)',
};

const STATUS_LABEL: Record<StatusGroup, string> = {
  online: 'Online',
  idle: 'Idle',
  offline: 'Offline',
};

export function OnlineUsersPanel({
  members,
  onlineMemberIds,
  currentUserId,
  collapsed,
  onToggle,
}: OnlineUsersPanelProps) {
  // Build online_at map (stored in presence state via localStorage approximation)
  const onlineAtMap = new Map<string, number>();

  const grouped: Record<StatusGroup, CellMemberWithProfile[]> = {
    online: [],
    idle: [],
    offline: [],
  };

  for (const m of members) {
    const status = getStatus(m.user_id, onlineMemberIds, onlineAtMap);
    grouped[status].push(m);
  }

  return (
    <div
      style={{
        width: collapsed ? 0 : 200,
        minWidth: collapsed ? 0 : 200,
        height: '100%',
        background: 'var(--color-panel)',
        borderLeft: '1px solid var(--color-border)',
        overflow: 'hidden',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {!collapsed && (
        <>
          {/* Header */}
          <div
            style={{
              height: 52,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 var(--space-3)',
              borderBottom: '1px solid var(--color-border)',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Members
            </span>
            <button
              onClick={onToggle}
              aria-label="Collapse panel"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-faint)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Member groups */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2) 0' }}>
            {(['online', 'idle', 'offline'] as StatusGroup[]).map((group) => {
              const groupMembers = grouped[group];
              if (groupMembers.length === 0) return null;
              return (
                <div key={group} style={{ marginBottom: 'var(--space-3)' }}>
                  <p
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-faint)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '0 var(--space-3)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    {STATUS_LABEL[group]} — {groupMembers.length}
                  </p>
                  {groupMembers.map((m) => {
                    const isCurrentUser = m.user_id === currentUserId;
                    const username = m.profiles?.username ?? 'Unknown';
                    const avatarUrl = m.profiles?.avatar_url ?? null;

                    return (
                      <div
                        key={m.user_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          padding: '4px var(--space-3)',
                          borderRadius: 'var(--radius-sm)',
                          margin: '0 var(--space-2)',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = 'var(--color-panel-hover)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                        }}
                      >
                        {/* Avatar with status dot */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <Avatar src={avatarUrl} name={username} size={28} />
                          <span
                            style={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: STATUS_DOT[group],
                              border: '2px solid var(--color-panel)',
                            }}
                          />
                        </div>

                        {/* Username */}
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: group === 'offline' ? 'var(--color-text-faint)' : 'var(--color-text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          {isCurrentUser ? `${username} (you)` : username}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

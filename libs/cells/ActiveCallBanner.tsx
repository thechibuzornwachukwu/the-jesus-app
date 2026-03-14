'use client';

import type { CellCall } from '../../lib/cells/types';

interface ActiveCallBannerProps {
  call: CellCall;
  isInCall: boolean;
  userRole: 'admin' | 'member';
  onJoin: () => void;
  onEnd: () => void;
}

export default function ActiveCallBanner({ call, isInCall, userRole, onJoin, onEnd }: ActiveCallBannerProps) {
  return (
    <div
      style={{
        height: 44,
        background: 'var(--color-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        gap: 8,
        flexShrink: 0,
      }}
    >
      {/* Left: pulse dot + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--color-success)',
            flexShrink: 0,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <span
          style={{
            color: 'var(--color-accent-text)',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Call in progress · started by {call.started_by_name}
        </span>
      </div>

      {/* Right: Join + End (admin) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {!isInCall && (
          <button
            onClick={onJoin}
            style={{
              height: 28,
              padding: '0 12px',
              background: 'var(--color-accent-text)',
              color: 'var(--color-accent)',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Join
          </button>
        )}
        {userRole === 'admin' && (
          <button
            onClick={onEnd}
            style={{
              height: 28,
              padding: '0 10px',
              background: 'transparent',
              color: 'var(--color-accent-text)',
              border: '1px solid rgba(4,5,3,0.4)',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            End
          </button>
        )}
      </div>
    </div>
  );
}

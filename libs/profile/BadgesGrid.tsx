'use client';

import React, { useState } from 'react';
import type { SavedVerse, JoinedCell, PostedVideo } from './types';

interface BadgeDef {
  id: string;
  label: string;
  description: string;
  /** hue for the earned color */
  hue: number;
  Shape: (props: { fill: string }) => React.ReactElement;
}

const CircleShape = ({ fill }: { fill: string }) => (
  <circle cx="24" cy="24" r="18" fill={fill} />
);
const DiamondShape = ({ fill }: { fill: string }) => (
  <polygon points="24,5 43,24 24,43 5,24" fill={fill} />
);
const ShieldShape = ({ fill }: { fill: string }) => (
  <path d="M24 4L41 11V26C41 34 24 44 24 44C24 44 7 34 7 26V11Z" fill={fill} />
);
const HexShape = ({ fill }: { fill: string }) => (
  <polygon points="24,4 40,13 40,31 24,40 8,31 8,13" fill={fill} />
);
const StarShape = ({ fill }: { fill: string }) => (
  <path d="M24 4l4.7 13.6H44l-11.9 8.6 4.5 13.8L24 31.6l-12.6 8.4 4.5-13.8L4 17.6h15.3z" fill={fill} />
);
const FlameShape = ({ fill }: { fill: string }) => (
  <path d="M24 4C20 12 12 18 12 26C12 34 17 42 24 42C31 42 36 34 36 26C36 18 28 12 24 4Z" fill={fill} />
);
const CrossShape = ({ fill }: { fill: string }) => (
  <path d="M20 4H28V20H44V28H28V44H20V28H4V20H20Z" fill={fill} />
);
const ScrollShape = ({ fill }: { fill: string }) => (
  <>
    <rect x="8" y="10" width="32" height="28" rx="3" fill={fill} />
    <rect x="5" y="10" width="6" height="28" rx="3" fill={fill} opacity="0.6" />
    <rect x="37" y="10" width="6" height="28" rx="3" fill={fill} opacity="0.6" />
  </>
);
const CrownShape = ({ fill }: { fill: string }) => (
  <path d="M6 38L10 18L20 30L24 14L28 30L38 18L42 38H6Z" fill={fill} />
);
const AnchorShape = ({ fill }: { fill: string }) => (
  <>
    <circle cx="24" cy="12" r="5" stroke={fill} strokeWidth="3" fill="none" />
    <line x1="24" y1="17" x2="24" y2="40" stroke={fill} strokeWidth="3" strokeLinecap="round" />
    <path d="M12 28C12 36 36 36 36 28" stroke={fill} strokeWidth="3" strokeLinecap="round" fill="none" />
    <line x1="12" y1="22" x2="36" y2="22" stroke={fill} strokeWidth="3" strokeLinecap="round" />
  </>
);

const BADGES: BadgeDef[] = [
  { id: 'first_verse',    label: 'First Word',     description: 'Save your first verse',          hue: 25,  Shape: CircleShape  },
  { id: 'streak_7',      label: 'Week Warrior',   description: 'Reach a 7-day streak',           hue: 45,  Shape: FlameShape   },
  { id: 'streak_30',     label: 'Monthly',        description: 'Reach a 30-day streak',          hue: 5,   Shape: FlameShape   },
  { id: 'first_cell',    label: 'Fellowship',     description: 'Join your first cell',           hue: 210, Shape: ShieldShape  },
  { id: 'first_video',   label: 'Witness',        description: 'Share your first video',         hue: 145, Shape: HexShape     },
  { id: 'note_taker',    label: 'Scribe',         description: 'Add notes to 5 verses',          hue: 275, Shape: ScrollShape  },
  { id: 'note_1',        label: 'Annotator',      description: 'Add your first note',            hue: 260, Shape: ScrollShape  },
  { id: 'cell_admin',    label: 'Shepherd',       description: 'Become a cell admin',            hue: 175, Shape: CrownShape   },
  { id: 'streak_100',    label: 'Century',        description: 'Reach a 100-day streak',         hue: 355, Shape: StarShape    },
  { id: 'anchor',        label: 'Anchor',         description: 'Reach a 365-day streak',         hue: 205, Shape: AnchorShape  },
  { id: 'multi_cell',    label: 'Connected',      description: 'Join 3 or more cells',           hue: 190, Shape: DiamondShape },
  { id: 'cross',         label: 'Faithful',       description: 'Complete all 5 faith tracks',    hue: 35,  Shape: CrossShape   },
];

function earnedColor(hue: number) {
  return `hsl(${hue}, 72%, 52%)`;
}
const UNEARNED = '#3a3a4a';

function computeEarned(
  badgeId: string,
  {
    savedVerses,
    joinedCells,
    postedVideos,
    streak,
    longestStreak,
    notesCount,
  }: {
    savedVerses: SavedVerse[];
    joinedCells: JoinedCell[];
    postedVideos: PostedVideo[];
    streak: number;
    longestStreak: number;
    notesCount: number;
  }
): boolean {
  const isAdmin = joinedCells.some((c) => c.role === 'admin');
  switch (badgeId) {
    case 'first_verse':  return savedVerses.length >= 1;
    case 'streak_7':     return streak >= 7 || longestStreak >= 7;
    case 'streak_30':    return streak >= 30 || longestStreak >= 30;
    case 'first_cell':   return joinedCells.length >= 1;
    case 'first_video':  return postedVideos.length >= 1;
    case 'note_1':       return notesCount >= 1;
    case 'note_taker':   return notesCount >= 5;
    case 'cell_admin':   return isAdmin;
    case 'streak_100':   return streak >= 100 || longestStreak >= 100;
    case 'anchor':       return streak >= 365 || longestStreak >= 365;
    case 'multi_cell':   return joinedCells.length >= 3;
    case 'cross':        return false; // future: course completion
    default:             return false;
  }
}

interface BadgesGridProps {
  savedVerses: SavedVerse[];
  joinedCells: JoinedCell[];
  postedVideos: PostedVideo[];
  streak: number;
  longestStreak: number;
}

export function BadgesGrid({ savedVerses, joinedCells, postedVideos, streak, longestStreak }: BadgesGridProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  const notesCount = savedVerses.filter((v) => v.note && v.note.trim().length > 0).length;
  const context = { savedVerses, joinedCells, postedVideos, streak, longestStreak, notesCount };

  const earnedCount = BADGES.filter((b) => computeEarned(b.id, context)).length;

  return (
    <div style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-6)' }}>
      <p
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-faint)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 'var(--font-weight-semibold)',
          margin: '0 0 var(--space-3)',
        }}
      >
        {earnedCount} / {BADGES.length} earned
      </p>

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          overflowX: 'auto',
          paddingBottom: 'var(--space-2)',
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
        }}
      >
        {BADGES.map((badge) => {
          const earned = computeEarned(badge.id, context);
          const fill = earned ? earnedColor(badge.hue) : UNEARNED;

          return (
            <button
              key={badge.id}
              onPointerDown={() => setTooltip(badge.id)}
              onPointerUp={() => setTooltip(null)}
              onPointerLeave={() => setTooltip(null)}
              aria-label={`${badge.label}: ${badge.description}${earned ? ' (earned)' : ' (locked)'}`}
              style={{
                flexShrink: 0,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-2)',
                position: 'relative',
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                style={{
                  filter: earned
                    ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))'
                    : 'none',
                  opacity: earned ? 1 : 0.35,
                  transition: 'opacity 0.2s',
                }}
                aria-hidden="true"
              >
                <badge.Shape fill={fill} />
              </svg>
              <span
                style={{
                  fontSize: '0.6rem',
                  color: earned ? 'var(--color-text-muted)' : 'var(--color-text-faint)',
                  textAlign: 'center',
                  fontWeight: 'var(--font-weight-medium)',
                  maxWidth: 52,
                  lineHeight: 1.2,
                }}
              >
                {badge.label}
              </span>

              {/* Tooltip on long-press */}
              {tooltip === badge.id && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: 8,
                    background: 'var(--color-surface-high, var(--color-surface))',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '6px 10px',
                    whiteSpace: 'nowrap',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text)',
                    pointerEvents: 'none',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  {badge.description}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

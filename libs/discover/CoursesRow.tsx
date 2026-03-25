'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Sparkles, Feather, Crown, Shield } from 'lucide-react';
import { Skeleton } from '../shared-ui/Skeleton';
import { vibrate } from '../shared-ui/haptics';
import type { CourseResult } from '../../lib/discover/actions';
import type { CourseProgress } from '../learn/types';

const TRACK_ICONS: Record<string, React.ElementType> = {
  salvation: Crown,
  prayer: Feather,
  grace: Sparkles,
  identity: BookOpen,
  warfare: Shield,
};

const TRACK_COLORS: Record<string, string> = {
  salvation: '#7c3aed',
  prayer: '#0ea5e9',
  grace: '#f59e0b',
  identity: '#10b981',
  warfare: '#ef4444',
};

interface CoursesRowProps {
  courses: CourseResult[];
  progress?: CourseProgress[];
  loading?: boolean;
}

export function CoursesRow({ courses, progress = [], loading }: CoursesRowProps) {
  const router = useRouter();

  function getProgress(trackId: string): number {
    const rows = progress.filter((p) => p.track_id === trackId && p.completed);
    return rows.length;
  }

  function handleTap(trackId: string) {
    vibrate([8]);
    router.push(`/equip?track=${trackId}`);
  }

  return (
    <section>
      <p
        style={{
          margin: '0 0 var(--space-2) var(--space-4)',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        Faith Courses
      </p>

      <div
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingLeft: 'var(--space-4)',
          paddingRight: 'var(--space-4)',
          paddingBottom: 4,
        }}
      >
        {loading
          ? [...Array(4)].map((_, i) => (
              <Skeleton key={i} style={{ height: 140, width: 130, borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
            ))
          : courses.map((c) => {
              const Icon = TRACK_ICONS[c.id] ?? BookOpen;
              const color = TRACK_COLORS[c.id] ?? 'var(--color-accent)';
              const done = getProgress(c.id);
              const enrolled = done > 0;

              return (
                <button
                  key={c.id}
                  onClick={() => handleTap(c.id)}
                  style={{
                    flexShrink: 0,
                    width: 130,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '12px 12px 10px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'background 0.12s',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-high)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface)'; }}
                >
                  {/* Icon bubble */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${color}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Icon size={18} color={color} strokeWidth={1.8} aria-hidden />
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      lineHeight: 1.2,
                    }}
                  >
                    {c.title}
                  </p>

                  <p
                    style={{
                      margin: '3px 0 8px',
                      fontSize: 11,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {c.lessonCount} lessons
                  </p>

                  {/* Progress pill */}
                  {enrolled ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-full)',
                        background: `${color}22`,
                        color,
                      }}
                    >
                      {done}/{c.lessonCount} done
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-accent-soft)',
                        color: 'var(--color-accent)',
                      }}
                    >
                      Start
                    </span>
                  )}
                </button>
              );
            })}
      </div>
    </section>
  );
}

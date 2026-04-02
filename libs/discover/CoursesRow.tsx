'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ChevronRight } from 'lucide-react';
import { Skeleton } from '../shared-ui/Skeleton';
import { vibrate } from '../shared-ui/haptics';
import type { CourseResult } from '../../lib/discover/actions';
import type { CourseProgress } from '../learn/types';

interface CoursesRowProps {
  courses: CourseResult[];
  progress: CourseProgress[];
  loading?: boolean;
}

function CourseCard({ course, done }: { course: CourseResult; done: number }) {
  const router = useRouter();
  const pct = course.lessonCount > 0 ? Math.round((done / course.lessonCount) * 100) : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => { vibrate([8]); router.push(`/learn?track=${course.id}`); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { vibrate([8]); router.push(`/learn?track=${course.id}`); } }}
      style={{
        flexShrink: 0,
        width: 160,
        padding: 14,
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        cursor: 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-high)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface)'; }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <GraduationCap size={18} color="var(--color-accent)" aria-hidden />
      </div>

      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--color-text)',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } as React.CSSProperties}
        >
          {course.title}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>
          {course.lessonCount} lessons
        </p>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 3,
          borderRadius: 99,
          background: 'var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--color-accent)',
            borderRadius: 99,
            transition: 'width 0.3s',
          }}
        />
      </div>
      <p style={{ margin: 0, fontSize: 10, color: 'var(--color-text-faint)' }}>
        {pct > 0 ? `${pct}% complete` : 'Not started'}
      </p>
    </div>
  );
}

export function CoursesRow({ courses, progress, loading }: CoursesRowProps) {
  const router = useRouter();

  const completedByTrack = new Map<string, number>();
  for (const p of progress) {
    if (p.completed) {
      completedByTrack.set(p.track_id, (completedByTrack.get(p.track_id) ?? 0) + 1);
    }
  }

  return (
    <section>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-4)',
          marginBottom: 'var(--space-2)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          Courses
        </p>
        <button
          onClick={() => router.push('/learn')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-accent)',
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          See all <ChevronRight size={14} strokeWidth={2.5} aria-hidden />
        </button>
      </div>

      <div
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingLeft: 'var(--space-4)',
          paddingRight: 'var(--space-4)',
          paddingBottom: 4,
        }}
      >
        {loading
          ? [...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                style={{ height: 140, width: 160, borderRadius: 'var(--radius-lg)', flexShrink: 0 }}
              />
            ))
          : courses.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                done={completedByTrack.get(c.id) ?? 0}
              />
            ))}
      </div>
    </section>
  );
}

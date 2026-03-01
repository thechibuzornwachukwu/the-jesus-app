'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronDown, Check, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { COURSE_TRACKS } from '../../lib/learn/course-content';
import type { CourseTrack, CourseLesson, CourseProgress } from './types';
import { upsertCourseProgress } from '../../lib/learn/actions';


// ─── Lesson Card ─────────────────────────────────────────────────────────────

function LessonCard({
  lesson,
  index,
  isComplete,
  onToggleComplete,
}: {
  lesson: CourseLesson;
  index: number;
  isComplete: boolean;
  onToggleComplete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: isComplete ? '1px solid var(--color-accent)' : '1px solid transparent',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-4)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-full)',
            background: isComplete ? 'var(--color-accent)' : 'var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: isComplete ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-bold)',
          }}
        >
          {isComplete ? <Check size={14} /> : index + 1}
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            {lesson.title}
          </p>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {lesson.scripture}
          </p>
        </div>
        <span style={{ color: 'var(--color-text-muted)', transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', display: 'flex' }}>
          <ChevronDown size={16} />
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '0 var(--space-4) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Verse */}
          <blockquote
            style={{
              margin: 0,
              padding: 'var(--space-3) var(--space-4)',
              borderLeft: '3px solid var(--color-accent)',
              background: 'var(--color-accent-tint)',
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            }}
          >
            <p style={{ margin: '0 0 var(--space-1)', fontFamily: 'var(--font-serif)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', lineHeight: 'var(--line-height-relaxed)', fontStyle: 'italic' }}>
              "{lesson.verse}"
            </p>
            <cite style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent)', fontStyle: 'normal', fontWeight: 'var(--font-weight-semibold)' }}>
               {lesson.scripture}
            </cite>
          </blockquote>

          {/* Teaching */}
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', lineHeight: 'var(--line-height-relaxed)' }}>
            {lesson.body}
          </p>

          {/* Reflection */}
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
            <p style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-accent-soft)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Reflection
            </p>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 'var(--line-height-relaxed)', fontStyle: 'italic' }}>
              {lesson.reflection}
            </p>
          </div>

          {/* Mark complete */}
          <button
            onClick={onToggleComplete}
            style={{
              background: isComplete ? 'transparent' : 'var(--color-accent)',
              border: isComplete ? '1px solid var(--color-border)' : 'none',
              color: isComplete ? 'var(--color-text-muted)' : 'var(--color-text-inverse)',
              borderRadius: 'var(--radius-full)',
              padding: 'var(--space-2) var(--space-5)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            {isComplete ? 'Mark Incomplete' : 'Mark Complete'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Track Detail ─────────────────────────────────────────────────────────────

function TrackDetail({
  track,
  completedLessons,
  onBack,
  onToggleLesson,
}: {
  track: CourseTrack;
  progress: CourseProgress | undefined;
  completedLessons: Set<string>;
  onBack: () => void;
  onToggleLesson: (lessonId: string, idx: number) => void;
}) {
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    setSummaryLoading(true);
    fetch('/api/learn/courses/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId: track.id }),
    })
      .then((r) => r.json())
      .then((d) => setSummary(d.summary ?? ''))
      .catch(() => {})
      .finally(() => setSummaryLoading(false));
  }, [track.id]);

  const doneCount = track.lessons.filter((l) => completedLessons.has(l.id)).length;
  const pct = Math.round((doneCount / track.lessons.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

      {/* Full-width header image */}
      {track.image && (
        <div
          style={{
            position: 'relative',
            height: 200,
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <Image
            src={track.image}
            alt={track.title}
            fill
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            sizes="100vw"
          />
          {/* gradient overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--gradient-card-overlay)',
            }}
          />
          {/* back button */}
          <button
            onClick={onBack}
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-full)',
              background: 'rgba(4,5,3,0.55)',
              backdropFilter: 'blur(6px)',
              border: 'none',
              color: '#f5f7f7',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={20} />
          </button>
          {/* title + progress overlay */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            <p
              style={{
                margin: 0,
                fontFamily: "'Archivo Condensed', var(--font-display)",
                fontSize: 'clamp(1.6rem, 7vw, 2rem)',
                fontWeight: 900,
                color: '#f5f7f7',
                lineHeight: 1,
                textShadow: '0 2px 8px rgba(4,5,3,0.5)',
              }}
            >
              {track.title}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-xs)', color: 'rgba(245,247,247,0.7)' }}>
              {doneCount} / {track.lessons.length} complete
            </p>
          </div>
        </div>
      )}

      {/* Fallback title (no image) */}
      {!track.image && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', padding: 'var(--space-1)', lineHeight: 0 }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <p style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
              {track.title}
            </p>
            <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {doneCount} / {track.lessons.length} complete
            </p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--color-accent)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* AI summary */}
      {summaryLoading ? (
        <div style={{ height: 56, background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      ) : summary ? (
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 'var(--line-height-relaxed)', fontStyle: 'italic', fontFamily: 'var(--font-serif)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-accent-tint)', borderLeft: '3px solid var(--color-accent)', borderRadius: '0 var(--radius-lg) var(--radius-lg) 0' }}>
          {summary}
        </p>
      ) : null}

      {/* Lessons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {track.lessons.map((lesson, i) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            index={i}
            isComplete={completedLessons.has(lesson.id)}
            onToggleComplete={() => onToggleLesson(lesson.id, i)}
          />
        ))}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ─── Track Grid Card ──────────────────────────────────────────────────────────

function TrackCard({
  track,
  completedCount,
  onClick,
}: {
  track: CourseTrack;
  completedCount: number;
  onClick: () => void;
}) {
  const pct = Math.round((completedCount / track.lessons.length) * 100);
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        cursor: 'pointer',
        textAlign: 'left',
        minHeight: 160,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 0,
        background: 'var(--color-bg-surface)',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Background image */}
      {track.image && (
        <>
          <Image
            src={track.image}
            alt={track.title}
            fill
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            sizes="50vw"
          />
          {/* gradient overlay  bottom-heavy so text is readable */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--gradient-card-overlay)',
            }}
          />
        </>
      )}

      {/* Card content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: 'var(--space-3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        <div>
          <p
            style={{
              margin: '0 0 2px',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: track.image ? '#f5f7f7' : 'var(--color-text-primary)',
              lineHeight: 1.15,
            }}
          >
            {track.title}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-size-xs)',
              color: track.image ? 'rgba(245,247,247,0.6)' : 'var(--color-text-muted)',
              lineHeight: 'var(--line-height-normal)',
            }}
          >
            {track.lessons.length} lessons
          </p>
        </div>

        {/* Mini progress */}
        <div style={{ height: 3, background: track.image ? 'rgba(245,247,247,0.25)' : 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'var(--color-accent)',
              borderRadius: 'var(--radius-full)',
            }}
          />
        </div>

        {pct > 0 && (
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: pct === 100 ? 'var(--color-success)' : 'var(--color-accent)' }}>
            {pct === 100 ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> Complete
              </span>
            ) : (
              `${pct}% done`
            )}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FaithCourses({ initialProgress }: { initialProgress: CourseProgress[] }) {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  // Map: trackId → Set<lessonId> of completed lesson IDs
  const [completedMap, setCompletedMap] = useState<Map<string, Set<string>>>(() => {
    const map = new Map<string, Set<string>>();
    for (const prog of initialProgress) {
      const track = COURSE_TRACKS.find((t) => t.id === prog.track_id);
      if (!track) continue;
      const completed = new Set<string>();
      for (let i = 0; i <= prog.lesson_idx && i < track.lessons.length; i++) {
        if (prog.completed || i < prog.lesson_idx) {
          completed.add(track.lessons[i].id);
        }
      }
      map.set(prog.track_id, completed);
    }
    return map;
  });

  const handleToggleLesson = useCallback(
    async (trackId: string, lessonId: string, lessonIdx: number) => {
      setCompletedMap((prev) => {
        const next = new Map(prev);
        const set = new Set(next.get(trackId) ?? []);
        if (set.has(lessonId)) {
          set.delete(lessonId);
        } else {
          set.add(lessonId);
        }
        next.set(trackId, set);
        return next;
      });

      const track = COURSE_TRACKS.find((t) => t.id === trackId);
      if (!track) return;
      const currentSet = completedMap.get(trackId) ?? new Set();
      const willBeComplete = !currentSet.has(lessonId);
      const newSet = new Set(currentSet);
      if (willBeComplete) newSet.add(lessonId); else newSet.delete(lessonId);
      const highestIdx = track.lessons.reduce((max, l, i) => (newSet.has(l.id) ? i : max), -1);
      const allDone = track.lessons.every((l) => newSet.has(l.id));

      await upsertCourseProgress(trackId, Math.max(0, highestIdx), allDone);
    },
    [completedMap]
  );

  const selectedTrack = selectedTrackId ? COURSE_TRACKS.find((t) => t.id === selectedTrackId) : null;

  if (selectedTrack) {
    const completedLessons = completedMap.get(selectedTrack.id) ?? new Set<string>();
    return (
      <TrackDetail
        track={selectedTrack}
        progress={undefined}
        completedLessons={completedLessons}
        onBack={() => setSelectedTrackId(null)}
        onToggleLesson={(lessonId, idx) => handleToggleLesson(selectedTrack.id, lessonId, idx)}
      />
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--space-3)',
      }}
    >
      {COURSE_TRACKS.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          completedCount={(completedMap.get(track.id) ?? new Set()).size}
          onClick={() => setSelectedTrackId(track.id)}
        />
      ))}
    </div>
  );
}

'use client';

// Stage 5B + 5C — Tabbed search results + result item components

import React, { useState, useEffect, useTransition } from 'react';
import {
  Users, BookMarked, GraduationCap, BookOpen, UserPlus, Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../shared-ui/Skeleton';
import { vibrate } from '../shared-ui/haptics';
import { Avatar } from '../shared-ui/Avatar';
import { followUser, unfollowUser } from '../../lib/profile/actions';
import {
  searchPeople,
  searchVerses,
  searchCourses,
  searchBooks,
} from '../../lib/discover/actions';
import { BookSheet, genreColor } from './BookSheet';
import { saveYourVerseRef } from './YourVerses';
import type { ProfileSummary } from '../../libs/profile/types';
import type { VerseResult, CourseResult } from '../../lib/discover/actions';
import type { Book } from '../../lib/discover/books';

type Tab = 'all' | 'people' | 'verses' | 'courses' | 'books';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'people', label: 'People' },
  { key: 'verses', label: 'Verses' },
  { key: 'courses', label: 'Courses' },
  { key: 'books', label: 'Books' },
];

// ---------------------------------------------------------------------------
// Result item components (Stage 5C)
// ---------------------------------------------------------------------------

function PersonResult({ person }: { person: ProfileSummary }) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [, start] = useTransition();

  function toggleFollow(e: React.MouseEvent) {
    e.stopPropagation();
    vibrate([6]);
    const next = !following;
    setFollowing(next);
    start(async () => {
      if (next) await followUser(person.id);
      else await unfollowUser(person.id);
    });
  }

  return (
    <div
      onClick={() => router.push(`/profile/${person.username}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/profile/${person.username}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Avatar src={person.avatar_url} name={person.username} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {person.username}
        </p>
        <p style={{ margin: '1px 0 0', fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          @{person.username}
        </p>
      </div>
      <button
        onClick={toggleFollow}
        style={{
          flexShrink: 0,
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          border: following ? '1.5px solid var(--color-border)' : 'none',
          background: following ? 'transparent' : 'var(--color-accent)',
          color: following ? 'var(--color-text-muted)' : 'var(--color-accent-text)',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {following ? <Check size={12} aria-hidden /> : <UserPlus size={12} aria-hidden />}
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}

function VerseResultItem({ verse }: { verse: VerseResult }) {
  const router = useRouter();

  function navigate() {
    saveYourVerseRef(verse.reference);
    const href = `/discover/verses/${encodeURIComponent(verse.reference)}`;
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void })
        .startViewTransition(() => router.push(href));
    } else {
      router.push(href);
    }
  }

  return (
    <div
      onClick={navigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate()}
      style={{
        padding: '10px 0',
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 14, color: 'var(--color-accent)' }}>
        {verse.reference}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: 'var(--color-text)',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } as React.CSSProperties}
      >
        {verse.text}
      </p>
    </div>
  );
}

function CourseResultItem({ course }: { course: CourseResult }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/equip?track=${course.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/equip?track=${course.id}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <GraduationCap size={20} color="var(--color-accent)" aria-hidden />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {course.title}
        </p>
        <p style={{ margin: '1px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
          {course.lessonCount} lessons
        </p>
      </div>
    </div>
  );
}

function BookResultItem({ book, onOpen }: { book: Book; onOpen: (b: Book) => void }) {
  const color = book.coverColor ?? genreColor(book.genre);
  return (
    <div
      onClick={() => { vibrate([6]); onOpen(book); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(book)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Color swatch */}
      <div
        style={{
          width: 40,
          height: 52,
          borderRadius: 4,
          background: `linear-gradient(140deg, ${color}cc 0%, ${color}66 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <BookOpen size={18} color="#fff" strokeWidth={1.5} aria-hidden />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {book.title}
        </p>
        <p style={{ margin: '1px 0 0', fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {book.author}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section header + empty state helpers
// ---------------------------------------------------------------------------

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 'var(--space-4) 0 var(--space-2)' }}>
      {icon}
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
        {label}
      </span>
    </div>
  );
}

function EmptyTab({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-10) var(--space-4)', gap: 'var(--space-3)', color: 'var(--color-text-muted)', textAlign: 'center',
    }}>
      {icon}
      <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text)' }}>{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SearchResults
// ---------------------------------------------------------------------------

interface Results {
  people: ProfileSummary[];
  verses: VerseResult[];
  courses: CourseResult[];
  books: Book[];
}

export function SearchResults({ query }: { query: string }) {
  const [tab, setTab] = useState<Tab>('all');
  const [results, setResults] = useState<Results>({ people: [], verses: [], courses: [], books: [] });
  const [loading, setLoading] = useState(false);
  const [openBook, setOpenBook] = useState<Book | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setLoading(true);
    startTransition(async () => {
      const [people, verses, courses, books] = await Promise.all([
        searchPeople(query, 20),
        searchVerses(query),
        searchCourses(query),
        searchBooks(query),
      ]);
      setResults({ people, verses, courses, books });
      setLoading(false);
    });
  }, [query]);

  const skeletonRows = (n: number) => (
    [...Array(n)].map((_, i) => (
      <Skeleton key={i} style={{ height: 60, borderRadius: 'var(--radius-md)', marginBottom: 8 }} />
    ))
  );

  const isEmpty =
    results.people.length === 0 &&
    results.verses.length === 0 &&
    results.courses.length === 0 &&
    results.books.length === 0;

  return (
    <div style={{ padding: '0 var(--space-4) var(--space-6)' }}>
      {/* Tab pills */}
      <div
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          padding: 'var(--space-3) 0',
          position: 'sticky',
          top: 0,
          background: 'var(--color-bg)',
          zIndex: 5,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { vibrate([4]); setTab(t.key); }}
            style={{
              flexShrink: 0,
              padding: '5px 14px',
              borderRadius: 'var(--radius-full)',
              border: tab === t.key ? 'none' : '1px solid var(--color-border)',
              background: tab === t.key ? 'var(--color-accent)' : 'transparent',
              color: tab === t.key ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && skeletonRows(5)}

      {!loading && (
        <>
          {/* ── All tab ── */}
          {tab === 'all' && (
            <>
              {isEmpty && (
                <EmptyTab
                  icon={<BookMarked size={40} strokeWidth={1.2} />}
                  message={`No results for "${query}"`}
                />
              )}

              {results.people.length > 0 && (
                <>
                  <SectionHeader icon={<Users size={13} color="var(--color-text-muted)" aria-hidden />} label="People" />
                  {results.people.slice(0, 2).map((p) => <PersonResult key={p.id} person={p} />)}
                </>
              )}

              {results.verses.length > 0 && (
                <>
                  <SectionHeader icon={<BookMarked size={13} color="var(--color-text-muted)" aria-hidden />} label="Verses" />
                  {results.verses.slice(0, 2).map((v) => <VerseResultItem key={v.reference} verse={v} />)}
                </>
              )}

              {results.courses.length > 0 && (
                <>
                  <SectionHeader icon={<GraduationCap size={13} color="var(--color-text-muted)" aria-hidden />} label="Courses" />
                  {results.courses.slice(0, 2).map((c) => <CourseResultItem key={c.id} course={c} />)}
                </>
              )}

              {results.books.length > 0 && (
                <>
                  <SectionHeader icon={<BookOpen size={13} color="var(--color-text-muted)" aria-hidden />} label="Books" />
                  {results.books.slice(0, 2).map((b) => (
                    <BookResultItem key={b.id} book={b} onOpen={setOpenBook} />
                  ))}
                </>
              )}
            </>
          )}

          {/* ── People tab ── */}
          {tab === 'people' && (
            results.people.length === 0
              ? <EmptyTab icon={<Users size={40} strokeWidth={1.2} />} message={`No people found for "${query}"`} />
              : results.people.map((p) => <PersonResult key={p.id} person={p} />)
          )}

          {/* ── Verses tab ── */}
          {tab === 'verses' && (
            results.verses.length === 0
              ? <EmptyTab icon={<BookMarked size={40} strokeWidth={1.2} />} message={`No verses found for "${query}"`} />
              : results.verses.map((v) => <VerseResultItem key={v.reference} verse={v} />)
          )}

          {/* ── Courses tab ── */}
          {tab === 'courses' && (
            results.courses.length === 0
              ? <EmptyTab icon={<GraduationCap size={40} strokeWidth={1.2} />} message={`No courses found for "${query}"`} />
              : results.courses.map((c) => <CourseResultItem key={c.id} course={c} />)
          )}

          {/* ── Books tab ── */}
          {tab === 'books' && (
            results.books.length === 0
              ? <EmptyTab icon={<BookOpen size={40} strokeWidth={1.2} />} message={`No books found for "${query}"`} />
              : results.books.map((b) => <BookResultItem key={b.id} book={b} onOpen={setOpenBook} />)
          )}
        </>
      )}

      {openBook && <BookSheet book={openBook} onClose={() => setOpenBook(null)} />}
    </div>
  );
}

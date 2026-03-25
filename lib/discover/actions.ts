'use server';

import { createClient } from '../supabase/server';
import { COURSE_TRACKS } from '../learn/course-content';
import { DAILY_VERSES } from '../explore/daily-verses';
import {
  searchUsers,
  getSuggestedUsers,
} from '../profile/actions';
import type { ProfileSummary } from '../../libs/profile/types';
import { CHRISTIAN_BOOKS } from './books';
import type { Book } from './books';
export type { Book as BookResult } from './books';

export type { ProfileSummary };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrendingVerse {
  verse_reference: string;
  verse_text: string | null;
  save_count: number;
}

export interface VerseResult {
  reference: string;
  text: string;
  source: 'daily' | 'saved' | 'course';
}

export interface CourseResult {
  id: string;
  title: string;
  description: string;
  lessonCount: number;
}

export interface DiscoverPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  verse_reference: string | null;
  verse_text: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: { id: string; username: string; avatar_url: string | null } | null;
}

// ---------------------------------------------------------------------------
// 2A-1: getTrendingVerses
// ---------------------------------------------------------------------------

export async function getTrendingVerses(limit = 10): Promise<TrendingVerse[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('saved_verses')
    .select('verse_reference, verse_text')
    .not('verse_reference', 'is', null);

  if (!data || data.length === 0) return [];

  // Count occurrences in-process (avoids needing group-by RPC)
  const counts = new Map<string, { count: number; text: string | null }>();
  for (const row of data) {
    const ref = row.verse_reference as string;
    const existing = counts.get(ref);
    if (existing) {
      existing.count++;
    } else {
      counts.set(ref, { count: 1, text: row.verse_text as string | null });
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([ref, { count, text }]) => ({
      verse_reference: ref,
      verse_text: text,
      save_count: count,
    }));
}

// ---------------------------------------------------------------------------
// 2A-2: searchPeople — delegates to existing profile/actions implementation
// ---------------------------------------------------------------------------

export async function searchPeople(
  query: string,
  limit = 20
): Promise<ProfileSummary[]> {
  return searchUsers(query, limit);
}

// ---------------------------------------------------------------------------
// 2A-3: searchVerses — static (daily + course) + DB saved_verses
// ---------------------------------------------------------------------------

export async function searchVerses(query: string): Promise<VerseResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: VerseResult[] = [];
  const seen = new Set<string>();

  // 1. Daily verses
  for (const v of DAILY_VERSES) {
    if (v.reference.toLowerCase().includes(q) || v.text.toLowerCase().includes(q)) {
      if (!seen.has(v.reference)) {
        seen.add(v.reference);
        results.push({ reference: v.reference, text: v.text, source: 'daily' });
      }
    }
  }

  // 2. Course lesson scriptures
  for (const track of COURSE_TRACKS) {
    for (const lesson of track.lessons) {
      if (
        lesson.scripture.toLowerCase().includes(q) ||
        lesson.verse.toLowerCase().includes(q)
      ) {
        if (!seen.has(lesson.scripture)) {
          seen.add(lesson.scripture);
          results.push({ reference: lesson.scripture, text: lesson.verse, source: 'course' });
        }
      }
    }
  }

  // 3. saved_verses table (user-submitted)
  const supabase = await createClient();
  const { data } = await supabase
    .from('saved_verses')
    .select('verse_reference, verse_text')
    .or(`verse_reference.ilike.%${q}%,verse_text.ilike.%${q}%`)
    .limit(20);

  for (const row of data ?? []) {
    const ref = row.verse_reference as string;
    if (ref && !seen.has(ref)) {
      seen.add(ref);
      results.push({
        reference: ref,
        text: (row.verse_text as string | null) ?? '',
        source: 'saved',
      });
    }
  }

  return results.slice(0, 15);
}

// ---------------------------------------------------------------------------
// 2A-4: searchCourses — in-memory filter of COURSE_TRACKS
// ---------------------------------------------------------------------------

export async function searchCourses(query: string): Promise<CourseResult[]> {
  const q = query.trim().toLowerCase();

  const all = COURSE_TRACKS.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    lessonCount: t.lessons.length,
  }));

  if (!q) return all;

  return COURSE_TRACKS
    .filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.lessons.some(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.scripture.toLowerCase().includes(q) ||
            l.body.toLowerCase().includes(q)
        )
    )
    .map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      lessonCount: t.lessons.length,
    }));
}

// ---------------------------------------------------------------------------
// 2A-5: searchBooks — in-memory filter of curated Christian books
// ---------------------------------------------------------------------------

export async function searchBooks(query: string): Promise<Book[]> {
  const q = query.trim().toLowerCase();
  if (!q) return CHRISTIAN_BOOKS;
  return CHRISTIAN_BOOKS.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.genre.toLowerCase().includes(q)
  );
}

// ---------------------------------------------------------------------------
// 2A-6: getPostsByVerseTag — paginated posts filtered by verse_reference
// ---------------------------------------------------------------------------

export async function getPostsByVerseTag(
  ref: string,
  cursor?: string
): Promise<{ posts: DiscoverPost[]; nextCursor: string | null }> {
  const PAGE = 20;
  const supabase = await createClient();

  let q = supabase
    .from('posts')
    .select(
      'id, user_id, content, image_url, verse_reference, verse_text, like_count, comment_count, created_at'
    )
    .eq('verse_reference', ref)
    .is('reply_to_post_id', null)
    .order('created_at', { ascending: false })
    .limit(PAGE);

  if (cursor) q = q.lt('created_at', cursor);

  const { data: posts } = await q;
  if (!posts || posts.length === 0) return { posts: [], nextCursor: null };

  const userIds = [...new Set(posts.map((p) => p.user_id as string))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      { id: p.id as string, username: p.username as string, avatar_url: p.avatar_url as string | null },
    ])
  );

  const enriched: DiscoverPost[] = posts.map((p) => ({
    id: p.id as string,
    user_id: p.user_id as string,
    content: p.content as string,
    image_url: p.image_url as string | null,
    verse_reference: p.verse_reference as string | null,
    verse_text: p.verse_text as string | null,
    like_count: p.like_count as number,
    comment_count: p.comment_count as number,
    created_at: p.created_at as string,
    author: profileMap.get(p.user_id as string) ?? null,
  }));

  const nextCursor =
    posts.length === PAGE ? (posts[posts.length - 1].created_at as string) : null;

  return { posts: enriched, nextCursor };
}

// ---------------------------------------------------------------------------
// 2A-8: getVerseStats — post count + save count for a verse reference
// ---------------------------------------------------------------------------

export interface VerseStats {
  post_count: number;
  save_count: number;
}

export async function getVerseStats(ref: string): Promise<VerseStats> {
  const supabase = await createClient();
  const [{ count: post_count }, { count: save_count }] = await Promise.all([
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('verse_reference', ref)
      .is('reply_to_post_id', null),
    supabase
      .from('saved_verses')
      .select('id', { count: 'exact', head: true })
      .eq('verse_reference', ref),
  ]);
  return { post_count: post_count ?? 0, save_count: save_count ?? 0 };
}

// ---------------------------------------------------------------------------
// 2A-7: getSuggestedPeople — delegates to existing profile/actions implementation
// ---------------------------------------------------------------------------

export async function getSuggestedPeople(
  _userId: string,
  limit = 20
): Promise<ProfileSummary[]> {
  return getSuggestedUsers(limit);
}


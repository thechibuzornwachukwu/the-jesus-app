'use server';

import { createClient } from '../supabase/server';
import { COURSE_TRACKS } from '../learn/course-content';
import { DAILY_VERSES } from '../explore/daily-verses';
import {
  searchUsers,
  getSuggestedUsers,
} from '../profile/actions';
import type { ProfileSummary } from '../../libs/profile/types';

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

export interface BookResult {
  id: string;
  title: string;
  author: string;
  description: string;
  genre: string;
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

export async function searchBooks(query: string): Promise<BookResult[]> {
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
// 2A-7: getSuggestedPeople — delegates to existing profile/actions implementation
// ---------------------------------------------------------------------------

export async function getSuggestedPeople(
  _userId: string,
  limit = 20
): Promise<ProfileSummary[]> {
  return getSuggestedUsers(limit);
}

// ---------------------------------------------------------------------------
// Static Christian books registry
// ---------------------------------------------------------------------------

const CHRISTIAN_BOOKS: BookResult[] = [
  {
    id: 'mere-christianity',
    title: 'Mere Christianity',
    author: 'C.S. Lewis',
    description: 'A foundational defense of the Christian faith, exploring morality, faith, and the nature of God.',
    genre: 'Apologetics',
  },
  {
    id: 'purpose-driven-life',
    title: 'The Purpose Driven Life',
    author: 'Rick Warren',
    description: 'A 40-day journey to discovering God\'s purpose for your life.',
    genre: 'Devotional',
  },
  {
    id: 'crazy-love',
    title: 'Crazy Love',
    author: 'Francis Chan',
    description: 'A call to stop living a lukewarm faith and pursue radical love for God.',
    genre: 'Discipleship',
  },
  {
    id: 'knowing-god',
    title: 'Knowing God',
    author: 'J.I. Packer',
    description: 'A classic exploration of the attributes of God and what it means to truly know Him.',
    genre: 'Theology',
  },
  {
    id: 'celebration-discipline',
    title: 'Celebration of Discipline',
    author: 'Richard Foster',
    description: 'A guide to the inward, outward, and corporate spiritual disciplines.',
    genre: 'Spiritual Formation',
  },
  {
    id: 'cost-discipleship',
    title: 'The Cost of Discipleship',
    author: 'Dietrich Bonhoeffer',
    description: 'A challenging examination of the Sermon on the Mount and what it means to follow Christ.',
    genre: 'Theology',
  },
  {
    id: 'desiring-god',
    title: 'Desiring God',
    author: 'John Piper',
    description: 'Christian Hedonism — the idea that God is most glorified when we are most satisfied in Him.',
    genre: 'Theology',
  },
  {
    id: 'battlefield-mind',
    title: 'Battlefield of the Mind',
    author: 'Joyce Meyer',
    description: 'A practical guide to winning the battle in your mind through God\'s Word.',
    genre: 'Spiritual Warfare',
  },
  {
    id: 'whisper',
    title: 'Whisper',
    author: 'Mark Batterson',
    description: 'How to hear the voice of God through seven love languages of the Holy Spirit.',
    genre: 'Prayer',
  },
  {
    id: 'power-praying-woman',
    title: 'The Power of a Praying Woman',
    author: 'Stormie Omartian',
    description: 'Prayers and insights for women seeking a deeper relationship with God.',
    genre: 'Prayer',
  },
  {
    id: 'sit-walk-stand',
    title: 'Sit, Walk, Stand',
    author: 'Watchman Nee',
    description: 'An exposition of Ephesians revealing three postures of the Christian life.',
    genre: 'Bible Study',
  },
  {
    id: 'prayer-keller',
    title: 'Prayer',
    author: 'Timothy Keller',
    description: 'Experiencing awe and intimacy with God, drawing on Augustine, Calvin, and Luther.',
    genre: 'Prayer',
  },
  {
    id: 'prodigal-god',
    title: 'The Prodigal God',
    author: 'Timothy Keller',
    description: 'A fresh look at the parable of the prodigal son, revealing the true gospel of grace.',
    genre: 'Gospel',
  },
  {
    id: 'redeeming-love',
    title: 'Redeeming Love',
    author: 'Francine Rivers',
    description: 'The story of Hosea set in the California Gold Rush — a retelling of God\'s relentless love.',
    genre: 'Fiction',
  },
  {
    id: 'pilgrims-progress',
    title: "Pilgrim's Progress",
    author: 'John Bunyan',
    description: 'The allegorical journey of Christian from the City of Destruction to the Celestial City.',
    genre: 'Classic',
  },
  {
    id: 'jesus-calling',
    title: 'Jesus Calling',
    author: 'Sarah Young',
    description: '365 daily devotional entries written as if Jesus is speaking directly to the reader.',
    genre: 'Devotional',
  },
  {
    id: 'boundaries',
    title: 'Boundaries',
    author: 'Henry Cloud & John Townsend',
    description: 'When to say yes, how to say no, to take control of your life.',
    genre: 'Christian Living',
  },
  {
    id: 'surprised-by-joy',
    title: 'Surprised by Joy',
    author: 'C.S. Lewis',
    description: 'Lewis\'s account of his spiritual journey from atheism to Christian faith.',
    genre: 'Memoir',
  },
  {
    id: 'experiencing-god',
    title: 'Experiencing God',
    author: 'Henry Blackaby',
    description: 'Knowing and doing the will of God through seven realities of experiencing Him.',
    genre: 'Devotional',
  },
  {
    id: 'the-shack',
    title: 'The Shack',
    author: 'William P. Young',
    description: 'A story of healing and encounter with the Trinity in the midst of unspeakable loss.',
    genre: 'Fiction',
  },
];

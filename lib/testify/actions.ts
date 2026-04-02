'use server';

import { createClient } from '../supabase/server';
import { logDailyEngagement } from '../streaks/actions';
import type { Testimony, ReactionType, TestimonyCategory } from './types';

// ---------------------------------------------------------------------------
// Category mapping: UI enum ↔ DB enum (04_testify.sql)
// DB accepts: 'addiction' | 'grief' | 'healing' | 'salvation' | 'anxiety' | 'relationship' | 'other'
// ---------------------------------------------------------------------------
const UI_TO_DB: Record<string, string> = {
  Salvation: 'salvation',
  Healing: 'healing',
  Marriage: 'relationship',
  Restoration: 'relationship',
  Provision: 'other',
  Breakthrough: 'other',
  Deliverance: 'other',
  Protection: 'other',
};

const DB_TO_UI: Record<string, TestimonyCategory> = {
  salvation: 'Salvation',
  healing: 'Healing',
  relationship: 'Restoration',
  addiction: 'Deliverance',
  grief: 'Restoration',
  anxiety: 'Breakthrough',
  other: 'Breakthrough',
};

function toDbCategory(ui: string): string {
  return UI_TO_DB[ui] ?? 'other';
}

function toUiCategory(db: string): TestimonyCategory {
  return DB_TO_UI[db] ?? 'Breakthrough';
}

// ---------------------------------------------------------------------------
// Helper — enrich raw testimony rows with profile + reaction data
// ---------------------------------------------------------------------------
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function enrichTestimonies(
  supabase: SupabaseClient,
  userId: string,
  rows: Record<string, unknown>[]
): Promise<Testimony[]> {
  if (!rows.length) return [];

  const ids = rows.map((r) => r.id as string);
  const userIds = [...new Set(rows.map((r) => r.user_id as string))];

  const [profilesRes, reactionsRes] = await Promise.all([
    supabase.from('profiles').select('id, username, avatar_url').in('id', userIds),
    supabase
      .from('testimony_reactions')
      .select('testimony_id, user_id, reaction_type')
      .in('testimony_id', ids),
  ]);

  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [
      p.id as string,
      { id: p.id as string, username: p.username as string, avatar_url: p.avatar_url as string | undefined },
    ])
  );

  type RxRow = { testimony_id: string; user_id: string; reaction_type: string };
  const reactionRows = (reactionsRes.data ?? []) as RxRow[];

  const countMap = new Map<string, Record<ReactionType, number>>();
  const userReactionMap = new Map<string, ReactionType>();
  for (const r of reactionRows) {
    if (!countMap.has(r.testimony_id)) {
      countMap.set(r.testimony_id, { amen: 0, praying: 0, thankful: 0 });
    }
    const rt = r.reaction_type as ReactionType;
    countMap.get(r.testimony_id)![rt]++;
    if (r.user_id === userId) userReactionMap.set(r.testimony_id, rt);
  }

  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    category: toUiCategory(r.category as string),
    full_story: r.body as string,
    media_url: r.media_url as string | undefined,
    show_streak: r.show_streak as boolean,
    author: profileMap.get(r.user_id as string) ?? {
      id: r.user_id as string,
      username: 'unknown',
    },
    reaction_counts: countMap.get(r.id as string) ?? { amen: 0, praying: 0, thankful: 0 },
    user_reaction: userReactionMap.get(r.id as string) ?? null,
    created_at: r.created_at as string,
  }));
}

// ---------------------------------------------------------------------------
// getTestimonies — paginated
// ---------------------------------------------------------------------------
export async function getTestimonies(cursor?: string): Promise<{
  testimonies: Testimony[];
  nextCursor: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { testimonies: [], nextCursor: null };

  const PAGE = 15;

  let q = supabase
    .from('testimonies')
    .select('id, user_id, title, category, body, media_url, show_streak, like_count, created_at')
    .order('created_at', { ascending: false })
    .limit(PAGE);

  if (cursor) q = q.lt('created_at', cursor);

  const { data } = await q;
  if (!data?.length) return { testimonies: [], nextCursor: null };

  const testimonies = await enrichTestimonies(
    supabase,
    user.id,
    data as Record<string, unknown>[]
  );
  const nextCursor = data.length === PAGE ? (data[data.length - 1].created_at as string) : null;

  return { testimonies, nextCursor };
}

// ---------------------------------------------------------------------------
// getTestimonyById
// ---------------------------------------------------------------------------
export async function getTestimonyById(id: string): Promise<Testimony | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('testimonies')
    .select('id, user_id, title, category, body, media_url, show_streak, like_count, created_at')
    .eq('id', id)
    .single();

  if (!data) return null;
  const rows = await enrichTestimonies(supabase, user.id, [data as Record<string, unknown>]);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// submitTestimony — inserts into testimonies table + optional media upload
// media_url: pass a pre-uploaded URL (upload from client first), or omit
// ---------------------------------------------------------------------------
export async function submitTestimony(data: {
  title: string;
  category: string;
  full_story: string;
  show_streak: boolean;
  media_url?: string;
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  if (!data.title.trim()) return { error: 'Title is required' };
  if (data.full_story.trim().length < 100)
    return { error: 'Story must be at least 100 characters' };

  const { data: inserted, error } = await supabase
    .from('testimonies')
    .insert({
      user_id: user.id,
      title: data.title.trim(),
      category: toDbCategory(data.category),
      body: data.full_story.trim(),
      show_streak: data.show_streak,
      media_url: data.media_url ?? null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  await logDailyEngagement(user.id);

  return { id: (inserted as { id: string }).id };
}

// ---------------------------------------------------------------------------
// toggleTestimonyReaction
// ---------------------------------------------------------------------------
export async function toggleTestimonyReaction(
  testimonyId: string,
  reaction: ReactionType
): Promise<{
  userReaction: ReactionType | null;
  counts: Record<ReactionType, number>;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const empty = {
    userReaction: null as ReactionType | null,
    counts: { amen: 0, praying: 0, thankful: 0 },
  };
  if (!user) return { ...empty, error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('testimony_reactions')
    .select('reaction_type')
    .eq('user_id', user.id)
    .eq('testimony_id', testimonyId)
    .maybeSingle();

  if (existing) {
    const prev = (existing as { reaction_type: string }).reaction_type;
    if (prev === reaction) {
      // Same — remove
      await supabase
        .from('testimony_reactions')
        .delete()
        .eq('user_id', user.id)
        .eq('testimony_id', testimonyId);
    } else {
      // Switch reaction
      await supabase
        .from('testimony_reactions')
        .update({ reaction_type: reaction })
        .eq('user_id', user.id)
        .eq('testimony_id', testimonyId);
    }
  } else {
    await supabase
      .from('testimony_reactions')
      .insert({ user_id: user.id, testimony_id: testimonyId, reaction_type: reaction });

    await logDailyEngagement(user.id);
  }

  // Re-fetch updated counts
  const { data: rows } = await supabase
    .from('testimony_reactions')
    .select('user_id, reaction_type')
    .eq('testimony_id', testimonyId);

  const counts: Record<ReactionType, number> = { amen: 0, praying: 0, thankful: 0 };
  let userReaction: ReactionType | null = null;

  for (const r of (rows ?? []) as { user_id: string; reaction_type: string }[]) {
    const rt = r.reaction_type as ReactionType;
    counts[rt]++;
    if (r.user_id === user.id) userReaction = rt;
  }

  return { userReaction, counts };
}

// ---------------------------------------------------------------------------
// addTestimonyComment — posts table used for testimony comments (thread)
// ---------------------------------------------------------------------------
export async function addTestimonyComment(
  testimonyId: string,
  content: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Store testimony comments in post_comments table with post_id = testimonyId
  // Requires the testimonies table to coexist with posts; use a dedicated insert
  const { error } = await supabase
    .from('post_comments')
    .insert({ post_id: testimonyId, user_id: user.id, content: content.trim() });

  if (error) return { error: error.message };
  return {};
}

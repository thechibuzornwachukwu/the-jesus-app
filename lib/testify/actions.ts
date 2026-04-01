'use server';

import type { Testimony, ReactionType } from './types';
import { MOCK_TESTIMONIES } from './mock-data';

export async function getTestimonies(_cursor?: string): Promise<{
  testimonies: Testimony[];
  nextCursor: string | null;
}> {
  return { testimonies: MOCK_TESTIMONIES, nextCursor: null };
}

export async function getTestimonyById(id: string): Promise<Testimony | null> {
  return MOCK_TESTIMONIES.find((t) => t.id === id) ?? null;
}

export async function submitTestimony(_data: {
  title: string;
  category: string;
  full_story: string;
  show_streak: boolean;
  media_file?: File;
}): Promise<{ id?: string; error?: string }> {
  // Stub — no DB call yet
  return { id: 'new-testimony-stub' };
}

export async function toggleTestimonyReaction(
  _testimonyId: string,
  _reaction: ReactionType
): Promise<{
  userReaction: ReactionType | null;
  counts: Record<ReactionType, number>;
  error?: string;
}> {
  // Stub
  return {
    userReaction: null,
    counts: { amen: 0, praying: 0, thankful: 0 },
  };
}

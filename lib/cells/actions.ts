'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '../supabase/server';
import type { Cell, CellMemberWithProfile, CellWithPreview, MemberPreview } from './types';

const CATEGORIES = ['Prayer', 'Bible Study', 'Youth', 'Worship', 'Discipleship', 'General'] as const;

function generateCellSlug(name: string, id: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base}-${id.slice(0, 4)}`;
}

async function fetchCellSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cellId: string
): Promise<string> {
  const { data } = await supabase.from('cells').select('slug').eq('id', cellId).single();
  return (data as { slug?: string } | null)?.slug ?? cellId;
}

const cellSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  category: z.enum(CATEGORIES),
  avatar_url: z.string().optional(),
  is_public: z.enum(['true', 'false']).transform((v) => v === 'true'),
});

const updateCellSchema = cellSchema.extend({
  banner_url: z.string().optional(),
  rules: z.string().max(500).optional(),
  member_limit: z.coerce.number().int().min(2).max(10000).optional(),
});

export async function createCell(
  formData: FormData
): Promise<{ cellId: string; slug: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const raw = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    category: formData.get('category'),
    avatar_url: formData.get('avatar_url') || undefined,
    is_public: (formData.get('is_public') as string) ?? 'true',
  };

  const parsed = cellSchema.safeParse(raw);
  if (!parsed.success) return { error: 'Invalid cell details.' };

  const { data: cell, error: cellError } = await supabase
    .from('cells')
    .insert({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
      avatar_url: parsed.data.avatar_url ?? null,
      creator_id: user.id,
      is_public: parsed.data.is_public,
    })
    .select('id')
    .single();

  if (cellError || !cell) return { error: 'Failed to create cell.' };

  // Generate and store the slug
  const slug = generateCellSlug(parsed.data.name, cell.id);
  await supabase.from('cells').update({ slug }).eq('id', cell.id);

  await supabase.from('cell_members').insert({
    cell_id: cell.id,
    user_id: user.id,
    role: 'admin',
  });

  revalidatePath('/engage');
  return { cellId: cell.id, slug };
}

export async function joinCell(cellId: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { error } = await supabase.from('cell_members').insert({
    cell_id: cellId,
    user_id: user.id,
    role: 'member',
  });

  if (error) return { error: 'Failed to join cell.' };

  const slug = await fetchCellSlug(supabase, cellId);
  revalidatePath('/engage');
  revalidatePath(`/engage/${slug}/info`);
  return { success: true };
}

export async function leaveCell(cellId: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  await supabase
    .from('cell_members')
    .delete()
    .eq('cell_id', cellId)
    .eq('user_id', user.id);

  const slug = await fetchCellSlug(supabase, cellId);
  revalidatePath(`/engage/${slug}`);
  revalidatePath('/engage');
  return { success: true };
}

export async function updateCell(
  cellId: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  // Allow creator OR any admin member to update (parallel fetch)
  const [{ data: membership }, { data: cell }] = await Promise.all([
    supabase.from('cell_members').select('role').eq('cell_id', cellId).eq('user_id', user.id).single(),
    supabase.from('cells').select('creator_id').eq('id', cellId).single(),
  ]);

  const isCreator = (cell as { creator_id: string } | null)?.creator_id === user.id;
  const isAdmin = membership?.role === 'admin';
  if (!isCreator && !isAdmin) return { error: 'Not authorized.' };

  const memberLimitRaw = formData.get('member_limit');
  const raw = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    category: formData.get('category'),
    avatar_url: formData.get('avatar_url') || undefined,
    is_public: (formData.get('is_public') as string) ?? 'true',
    banner_url: formData.get('banner_url') || undefined,
    rules: formData.get('rules') || undefined,
    member_limit: memberLimitRaw ? memberLimitRaw : undefined,
  };

  const parsed = updateCellSchema.safeParse(raw);
  if (!parsed.success) return { error: 'Invalid cell details.' };

  const { error } = await supabase
    .from('cells')
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
      avatar_url: parsed.data.avatar_url ?? null,
      is_public: parsed.data.is_public,
      banner_url: parsed.data.banner_url ?? null,
      rules: parsed.data.rules ?? null,
      member_limit: parsed.data.member_limit ?? null,
    })
    .eq('id', cellId);

  if (error) return { error: 'Failed to update cell.' };

  const slug = await fetchCellSlug(supabase, cellId);
  revalidatePath('/engage');
  revalidatePath(`/engage/${slug}/info`);
  return { success: true };
}

// ─── Phase 4 Redesign: enrichment helpers ──────────────────────────────────

type RawMemberRow = {
  cell_id: string;
  profiles: { username: string; avatar_url: string | null } | null;
};
type RawMessageRow = { cell_id: string; created_at: string };

function buildMemberMap(rows: RawMemberRow[]): Map<string, MemberPreview[]> {
  const map = new Map<string, MemberPreview[]>();
  for (const row of rows) {
    const list = map.get(row.cell_id) ?? [];
    if (list.length < 3) {
      list.push({ username: row.profiles?.username ?? '', avatar_url: row.profiles?.avatar_url ?? null });
      map.set(row.cell_id, list);
    }
  }
  return map;
}

function buildActivityMap(rows: RawMessageRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (!map.has(row.cell_id)) map.set(row.cell_id, row.created_at);
  }
  return map;
}

async function enrichCells(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cells: Cell[]
): Promise<CellWithPreview[]> {
  if (cells.length === 0) return [];
  const cellIds = cells.map((c) => c.id);

  const [membersRes, messagesRes] = await Promise.all([
    supabase
      .from('cell_members')
      .select('cell_id, profiles(username, avatar_url)')
      .in('cell_id', cellIds)
      .order('joined_at', { ascending: true }),
    supabase
      .from('chat_messages')
      .select('cell_id, created_at')
      .in('cell_id', cellIds)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const memberMap = buildMemberMap((membersRes.data ?? []) as unknown as RawMemberRow[]);
  const activityMap = buildActivityMap((messagesRes.data ?? []) as unknown as RawMessageRow[]);

  return cells.map((cell) => ({
    ...cell,
    member_preview: memberMap.get(cell.id) ?? [],
    last_activity: activityMap.get(cell.id) ?? null,
  }));
}

export async function getCellsWithMemberPreviews(excludeIds: string[]): Promise<CellWithPreview[]> {
  const supabase = await createClient();

  let query = supabase
    .from('cells')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data: cells } = await query;
  return enrichCells(supabase, (cells as Cell[]) ?? []);
}

export async function getMyCellsWithPreviews(userId: string): Promise<CellWithPreview[]> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from('cell_members')
    .select('cell_id, cells(*)')
    .eq('user_id', userId);

  const cells: Cell[] = (memberships ?? [])
    .map((m) => (m as { cells: unknown }).cells as Cell)
    .filter(Boolean);

  return enrichCells(supabase, cells);
}

// ─── Phase 6: Cells 2.0 ────────────────────────────────────────────────────

export async function getCellMembers(cellId: string): Promise<CellMemberWithProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('cell_members')
    .select('cell_id, user_id, role, joined_at, profiles(id, username, avatar_url)')
    .eq('cell_id', cellId)
    .order('role', { ascending: false }) // admin first
    .order('joined_at', { ascending: true });

  return (data as unknown as CellMemberWithProfile[]) ?? [];
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function getOrCreatePermanentInvite(cellId: string): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('cell_members')
    .select('role')
    .eq('cell_id', cellId)
    .eq('user_id', user.id)
    .single();

  if (!membership) return null;

  // Look for existing permanent invite (no expiry, no max_uses)
  const { data: existing } = await supabase
    .from('cell_invites')
    .select('code')
    .eq('cell_id', cellId)
    .is('expires_at', null)
    .is('max_uses', null)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.code;

  // Only admins can create a new permanent invite
  if (membership.role !== 'admin') return null;

  const code = generateInviteCode();
  const { error } = await supabase.from('cell_invites').insert({
    cell_id: cellId,
    code,
    created_by: user.id,
    expires_at: null,
    max_uses: null,
  });

  return error ? null : code;
}

export async function createInvite(
  cellId: string,
  expiresInDays?: number
): Promise<{ code: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  // Only admins can create invites
  const { data: membership } = await supabase
    .from('cell_members')
    .select('role')
    .eq('cell_id', cellId)
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.role !== 'admin') return { error: 'Not authorized.' };

  const code = generateInviteCode();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400 * 1000).toISOString()
    : null;

  const { error } = await supabase.from('cell_invites').insert({
    cell_id: cellId,
    code,
    created_by: user.id,
    expires_at: expiresAt,
    max_uses: null,
  });

  if (error) return { error: 'Failed to create invite.' };
  return { code };
}

export async function joinByInvite(
  code: string
): Promise<{ cellId: string; cellSlug: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: invite } = await supabase
    .from('cell_invites')
    .select('id, cell_id, expires_at, max_uses, use_count')
    .eq('code', code.toUpperCase())
    .single();

  if (!invite) return { error: 'Invite not found.' };

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { error: 'Invite has expired.' };
  }

  if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
    return { error: 'Invite has reached its maximum uses.' };
  }

  // Check already a member
  const { data: existing } = await supabase
    .from('cell_members')
    .select('user_id')
    .eq('cell_id', invite.cell_id)
    .eq('user_id', user.id)
    .single();

  const cellSlug = await fetchCellSlug(supabase, invite.cell_id);

  if (existing) return { cellId: invite.cell_id, cellSlug };

  const { error: joinError } = await supabase.from('cell_members').insert({
    cell_id: invite.cell_id,
    user_id: user.id,
    role: 'member',
  });

  if (joinError) return { error: 'Failed to join cell.' };

  // Increment use_count
  await supabase
    .from('cell_invites')
    .update({ use_count: invite.use_count + 1 })
    .eq('id', invite.id);

  revalidatePath('/engage');
  return { cellId: invite.cell_id, cellSlug };
}

export async function kickMember(
  cellId: string,
  targetUserId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: membership } = await supabase
    .from('cell_members')
    .select('role')
    .eq('cell_id', cellId)
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.role !== 'admin') return { error: 'Not authorized.' };
  if (targetUserId === user.id) return { error: 'Cannot kick yourself.' };

  await supabase
    .from('cell_members')
    .delete()
    .eq('cell_id', cellId)
    .eq('user_id', targetUserId);

  const slug = await fetchCellSlug(supabase, cellId);
  revalidatePath(`/engage/${slug}`);
  return { success: true };
}

export async function promoteToAdmin(
  cellId: string,
  targetUserId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: membership } = await supabase
    .from('cell_members')
    .select('role')
    .eq('cell_id', cellId)
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.role !== 'admin') return { error: 'Not authorized.' };

  const { error } = await supabase
    .from('cell_members')
    .update({ role: 'admin' })
    .eq('cell_id', cellId)
    .eq('user_id', targetUserId);

  if (error) return { error: 'Failed to promote member.' };

  const slug = await fetchCellSlug(supabase, cellId);
  revalidatePath(`/engage/${slug}`);
  return { success: true };
}

// ─── Phase 6.3: Message Scheduling ────────────────────────────────────────────

export interface ScheduledMessage {
  id: string;
  cell_id: string;
  user_id: string;
  content: string | null;
  message_type: string;
  audio_url: string | null;
  send_at: string;
  sent: boolean;
  created_at: string;
}

export async function scheduleMessage(
  cellId: string,
  content: string,
  sendAt: string
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  // Must be a cell member
  const { data: membership } = await supabase
    .from('cell_members')
    .select('user_id')
    .eq('cell_id', cellId)
    .eq('user_id', user.id)
    .single();
  if (!membership) return { error: 'Not a cell member.' };

  // Must be in the future (at least 1 minute)
  if (new Date(sendAt).getTime() < Date.now() + 60_000) {
    return { error: 'Send time must be at least 1 minute in the future.' };
  }

  const { data, error } = await supabase
    .from('scheduled_messages')
    .insert({
      cell_id: cellId,
      user_id: user.id,
      content,
      message_type: 'text',
      send_at: sendAt,
    })
    .select('id')
    .single();

  if (error || !data) return { error: 'Failed to schedule message.' };
  return { id: data.id };
}

export async function getScheduledMessages(cellId: string): Promise<ScheduledMessage[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('scheduled_messages')
    .select('*')
    .eq('cell_id', cellId)
    .eq('user_id', user.id)
    .eq('sent', false)
    .order('send_at', { ascending: true });

  return (data as ScheduledMessage[]) ?? [];
}

export async function cancelScheduledMessage(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { error } = await supabase
    .from('scheduled_messages')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('sent', false);

  if (error) return { error: 'Failed to cancel message.' };
  return { success: true };
}

export async function updateScheduledMessage(
  id: string,
  sendAt: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  if (new Date(sendAt).getTime() < Date.now() + 60_000) {
    return { error: 'Send time must be at least 1 minute in the future.' };
  }

  const { error } = await supabase
    .from('scheduled_messages')
    .update({ send_at: sendAt })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('sent', false);

  if (error) return { error: 'Failed to update scheduled message.' };
  return { success: true };
}

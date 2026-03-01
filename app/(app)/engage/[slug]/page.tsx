import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

interface CellPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CellPage({ params }: CellPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  // Resolve cell by slug
  const { data: cell } = await supabase
    .from('cells')
    .select('id, slug')
    .eq('slug', slug)
    .single();

  if (!cell) redirect('/engage');

  // Verify membership
  const { data: membership } = await supabase
    .from('cell_members')
    .select('role')
    .eq('cell_id', cell.id)
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect(`/engage/${slug}/info`);

  // Find default channel (lowest position)
  const { data: defaultChannel } = await supabase
    .from('channels')
    .select('id')
    .eq('cell_id', cell.id)
    .order('position', { ascending: true })
    .limit(1)
    .single();

  if (defaultChannel) {
    redirect(`/engage/${slug}/${defaultChannel.id}`);
  }

  // No channels yet — auto-create General channel using service role (bypasses RLS for all members)
  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: newCategory } = await adminClient
    .from('channel_categories')
    .insert({ cell_id: cell.id, name: 'General', position: 0 })
    .select('id')
    .single();

  if (newCategory) {
    const { data: newChannel } = await adminClient
      .from('channels')
      .insert({
        cell_id: cell.id,
        category_id: (newCategory as { id: string }).id,
        name: 'general',
        emoji: '💬',
        channel_type: 'text',
        position: 0,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (newChannel) {
      redirect(`/engage/${slug}/${(newChannel as { id: string }).id}`);
    }
  }

  // All else fails
  redirect(`/engage/${slug}/info`);
}

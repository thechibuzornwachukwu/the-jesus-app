import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';

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

  // No channels exist yet — fall back to info page
  redirect(`/engage/${slug}/info`);
}

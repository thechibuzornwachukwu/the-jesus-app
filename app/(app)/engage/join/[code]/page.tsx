import { redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { JoinByInviteClient } from './JoinByInviteClient';

interface JoinPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata() {
  return { title: 'Join Cell  The JESUS App' };
}

export default async function JoinByInvitePage({ params }: JoinPageProps) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/engage/join/${code}`);

  // Validate invite
  const { data: invite } = await supabase
    .from('cell_invites')
    .select('id, cell_id, expires_at, max_uses, use_count')
    .eq('code', code.toUpperCase())
    .single();

  if (!invite) {
    return (
      <JoinByInviteClient
        code={code}
        cell={null}
        alreadyMember={false}
        invalidReason="This invite link is invalid or has been revoked."
      />
    );
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return (
      <JoinByInviteClient
        code={code}
        cell={null}
        alreadyMember={false}
        invalidReason="This invite link has expired."
      />
    );
  }

  if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
    return (
      <JoinByInviteClient
        code={code}
        cell={null}
        alreadyMember={false}
        invalidReason="This invite link has reached its maximum uses."
      />
    );
  }

  const [{ data: cell }, { data: membership }, { count: memberCount }] = await Promise.all([
    supabase
      .from('cells')
      .select('id, slug, name, description, category, avatar_url, is_public')
      .eq('id', invite.cell_id)
      .single(),
    supabase
      .from('cell_members')
      .select('user_id')
      .eq('cell_id', invite.cell_id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('cell_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('cell_id', invite.cell_id),
  ]);

  if (!cell) redirect('/engage');

  // Already a member  skip confirmation, go straight to chat
  if (membership) redirect(`/engage/${(cell as { slug: string }).slug}`);

  return (
    <JoinByInviteClient
      code={code}
      cell={{ ...cell, member_count: memberCount ?? 0 }}
      alreadyMember={false}
      invalidReason={null}
    />
  );
}

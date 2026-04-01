import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { getMessages, getPartnerProfile, markMessagesRead } from '../../../../lib/chat/actions';
import { ChatThreadClient } from './ChatThreadClient';

interface Props {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  const partner = await getPartnerProfile(userId);
  return { title: partner ? `@${partner.username} · Messages` : 'Messages · The JESUS App' };
}

export default async function ChatThreadPage({ params }: Props) {
  const { userId } = await params;

  const supabase = await createClient();
  const { data: { user: me } } = await supabase.auth.getUser();
  if (!me) redirect('/sign-in');

  const [partner, messages] = await Promise.all([
    getPartnerProfile(userId),
    getMessages(userId),
  ]);

  // Mark incoming messages as read on page load
  await markMessagesRead(userId);

  return (
    <ChatThreadClient
      partner={partner}
      initialMessages={messages}
      currentUserId={me.id}
    />
  );
}

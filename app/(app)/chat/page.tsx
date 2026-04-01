import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { getConversations } from '../../../lib/chat/actions';
import { ChatClient } from './ChatClient';

export const metadata = { title: 'Messages · The JESUS App' };

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const conversations = await getConversations();

  return <ChatClient conversations={conversations} />;
}

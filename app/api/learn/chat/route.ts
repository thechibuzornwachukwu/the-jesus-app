import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '../../../../lib/supabase/server';
import { z } from 'zod';

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }); }

const BodySchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .max(20)
    .default([]),
  sessionId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { message, history, sessionId } = parsed.data;

  // 1. Embed the user message
  const openai = getOpenAI();
  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: message,
  });
  const embedding = embeddingRes.data[0].embedding;

  // 2. Similarity search against theology_docs
  const { data: chunks } = await supabase.rpc('match_theology_docs', {
    query_embedding: embedding,
    match_threshold: 0.72,
    match_count: 5,
  });

  const context =
    (chunks ?? [])
      .map((c: { source: string; content: string }) => `[${c.source}]: ${c.content}`)
      .join('\n\n') || 'No specific passages matched. Answer from general Scripture knowledge.';

  // 3. Build GPT-4o messages
  const systemPrompt = `You are a Spirit-filled spiritual guide who answers with Scripture. Be warm, conversational, and encouraging — never preachy or condescending. Always ground your answer in the Bible. After your answer, include a brief "Scripture" section listing the key references you drew on (format: "**Scripture:** Ref1; Ref2"). End every response with a gentle follow-up question to deepen the conversation.

Relevant passages from Scripture and theology:
${context}`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  // 4. GPT-4o completion
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.7,
    max_tokens: 600,
  });

  const answer = completion.choices[0].message.content ?? '';

  // 5. Persist both turns (fire-and-forget — don't await)
  supabase.from('spiritual_conversations').insert([
    { user_id: user.id, session_id: sessionId, role: 'user', content: message },
    { user_id: user.id, session_id: sessionId, role: 'assistant', content: answer },
  ]);

  return NextResponse.json({ answer });
}

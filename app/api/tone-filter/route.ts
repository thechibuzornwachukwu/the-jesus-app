import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';

const bodySchema = z.object({
  content: z.string().min(1).max(2000),
});

const SYSTEM_PROMPT = `You are a tone moderation assistant for a Christian community app called The JESUS App.
Your job is to detect whether a user's message contains a condemning, preachy, judgmental, or shaming tone toward other believers.
Healthy disagreement and honest sharing are welcome; harsh condemnation, spiritual shaming, and self-righteous lecturing are not.

Respond ONLY with valid JSON in this exact shape:
{"pass": true} — if the message is fine.
{"pass": false, "suggestion": "<brief, kind alternative phrasing>"} — if the message needs adjustment.

Be gracious and err on the side of passing; only flag clearly harsh or shaming content.`;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // No key configured — pass everything through
    return NextResponse.json({ pass: true });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: parsed.data.content },
      ],
      max_tokens: 120,
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content ?? '{"pass":true}';
    const result = JSON.parse(raw) as { pass: boolean; suggestion?: string };
    return NextResponse.json(result);
  } catch {
    // On any OpenAI error, pass the message through rather than blocking the user
    return NextResponse.json({ pass: true });
  }
}

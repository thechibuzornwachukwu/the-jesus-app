import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { createClient } from '../../../lib/supabase/server';
import { appError } from '../../../lib/errors';

const bodySchema = z.object({
  content: z.string().min(1).max(2000),
  cellId: z.string().uuid().optional(),
});

const SYSTEM_PROMPT = `You are a tone moderation assistant for a Christian community app called The JESUS App.
Your job is to detect whether a user's message contains a condemning, preachy, judgmental, or shaming tone toward other believers.
Healthy disagreement and honest sharing are welcome; harsh condemnation, spiritual shaming, and self-righteous lecturing are not.

Respond ONLY with valid JSON in this exact shape:
{"pass": true}  if the message is fine.
{"pass": false, "suggestion": "<brief, kind alternative phrasing>"}  if the message needs adjustment.

Be gracious and err on the side of passing; only flag clearly harsh or shaming content.`;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(appError('JA-8002'), { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(appError('JA-8002'), { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const strikeWindowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const strictThreshold = 3;
  let recentStrikeCount = 0;
  if (user) {
    const { count } = await supabase
      .from('user_tone_strikes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', strikeWindowStart);
    recentStrikeCount = count ?? 0;
  }
  const strictMode = recentStrikeCount >= strictThreshold;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // No key configured  pass everything through
    return NextResponse.json({ pass: true });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        strictMode
          ? {
              role: 'system',
              content:
                'This user has repeated prior tone violations. Apply stricter moderation and fail borderline harsh phrasing.',
            }
          : null,
        { role: 'user', content: parsed.data.content },
      ].filter(Boolean) as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      max_tokens: 120,
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content ?? '{"pass":true}';
    const result = JSON.parse(raw) as { pass: boolean; suggestion?: string };

    if (!result.pass && user) {
      await supabase.from('user_tone_strikes').insert({
        user_id: user.id,
        cell_id: parsed.data.cellId ?? null,
        content_preview: parsed.data.content.slice(0, 240),
        severity: strictMode ? 'high' : 'medium',
      });
    }

    if (!result.pass && strictMode) {
      return NextResponse.json({
        pass: false,
        suggestion: result.suggestion,
        hardBlock: true,
        message:
          'Your message was blocked due to repeated harsh tone flags. Please rewrite with gentleness before sending.',
      });
    }

    return NextResponse.json(result);
  } catch {
    // On any OpenAI error, pass the message through rather than blocking the user
    return NextResponse.json({ pass: true });
  }
}

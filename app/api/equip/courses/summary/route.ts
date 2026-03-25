import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '../../../../../lib/supabase/server';
import { getTrackById } from '../../../../../lib/learn/course-content';
import { z } from 'zod';

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }); }

const BodySchema = z.object({ trackId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { trackId } = parsed.data;

  const track = getTrackById(trackId);
  if (!track) return NextResponse.json({ error: 'Unknown track' }, { status: 404 });

  // Check cache first
  const { data: cached } = await supabase
    .from('course_summaries')
    .select('summary')
    .eq('track_id', trackId)
    .single();

  if (cached) return NextResponse.json({ summary: cached.summary, cached: true });

  // Generate with GPT-4o
  const openai = getOpenAI();
  const lessonList = track.lessons
    .map((l) => `- ${l.title} (${l.scripture}): ${l.verse.slice(0, 100)}`)
    .join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a warm, Spirit-filled theologian writing a short thematic overview for a faith course. Be encouraging and Scripture-focused. Write 3-4 sentences.',
      },
      {
        role: 'user',
        content: `Write a thematic summary for the "${track.title}" faith course which covers:\n${lessonList}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  const summary = completion.choices[0].message.content?.trim() ?? '';

  // Cache in Supabase
  await supabase
    .from('course_summaries')
    .upsert({ track_id: trackId, summary, updated_at: new Date().toISOString() });

  return NextResponse.json({ summary, cached: false });
}

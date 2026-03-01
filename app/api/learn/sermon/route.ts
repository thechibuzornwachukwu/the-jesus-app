import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '../../../../lib/supabase/server';

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }); }

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB (Whisper limit)
const ALLOWED_AUDIO = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/flac',
  'video/mp4', // some recorders send mp4
]);

const EXTRACT_PROMPT = `You are a sermon notes extractor. Given a sermon transcript or text, extract structured notes and return them as a valid JSON object with exactly these keys:
- "summary": a single sentence that captures the central message
- "keyPoints": array of 3-7 concise key points (strings)
- "scriptures": array of scripture references mentioned or alluded to (strings, e.g. "John 3:16")
- "themes": array of 2-5 theological themes (strings, e.g. "Grace", "Redemption")
- "actionItems": array of 2-5 practical action items the congregation can apply (strings)

Return ONLY the JSON object  no markdown, no prose outside the JSON.`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = req.headers.get('content-type') ?? '';

  let transcript = '';

  if (contentType.includes('multipart/form-data')) {
    // ── Audio upload path ────────────────────────────────────────────────────
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const audio = formData.get('audio') as File | null;
    if (!audio) return NextResponse.json({ error: 'No audio file' }, { status: 400 });
    if (!ALLOWED_AUDIO.has(audio.type)) {
      return NextResponse.json({ error: 'Unsupported audio format' }, { status: 400 });
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'Audio exceeds 25 MB limit' }, { status: 400 });
    }

    const transcription = await getOpenAI().audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
    });
    transcript = transcription.text;
  } else {
    // ── Text paste path ──────────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body?.transcript || typeof body.transcript !== 'string') {
      return NextResponse.json({ error: 'transcript field required' }, { status: 400 });
    }
    transcript = body.transcript.trim().slice(0, 20000); // cap at 20k chars
  }

  if (!transcript) {
    return NextResponse.json({ error: 'Empty transcript' }, { status: 400 });
  }

  // Extract structured notes with GPT-4o
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: EXTRACT_PROMPT },
      {
        role: 'user',
        content: `Extract sermon notes from the following:\n\n${transcript.slice(0, 12000)}`,
      },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
    max_tokens: 800,
  });

  const raw = completion.choices[0].message.content ?? '{}';
  let notes: unknown;
  try {
    notes = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  return NextResponse.json({ notes, transcript: transcript.slice(0, 500) + (transcript.length > 500 ? '…' : '') });
}

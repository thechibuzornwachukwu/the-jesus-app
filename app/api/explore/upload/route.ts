import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const ALLOWED_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const caption = ((formData.get('caption') as string) ?? '').trim();
  const verseRef = ((formData.get('verse_reference') as string) ?? '').trim();
  const verseText = ((formData.get('verse_text') as string) ?? '').trim();

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Only MP4, WebM, or MOV videos are allowed.' },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File exceeds the 100 MB limit.' }, { status: 400 });
  }

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp4';
  const storagePath = `${user.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('videos')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('videos').getPublicUrl(storagePath);

  // Insert video record
  const { data: video, error: insertError } = await supabase
    .from('videos')
    .insert({
      user_id: user.id,
      url: publicUrl,
      caption: caption || null,
    })
    .select('id')
    .single();

  if (insertError || !video) {
    // Clean up the uploaded file on insert failure
    await supabase.storage.from('videos').remove([storagePath]);
    return NextResponse.json(
      { error: insertError?.message ?? 'Failed to save video' },
      { status: 500 }
    );
  }

  // Optionally insert verse tag
  if (verseRef && verseText) {
    await supabase.from('video_verses').insert({
      video_id: video.id,
      verse_reference: verseRef.slice(0, 80),
      verse_text: verseText.slice(0, 600),
      position_pct: 0.75,
    });
  }

  return NextResponse.json({ videoId: video.id });
}

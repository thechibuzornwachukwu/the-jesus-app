import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { appError, logError } from '../../../../lib/errors';
import { sniffMime, isMimeCompatible } from '../../../../lib/upload/sniff-mime';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_VIDEO = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const ALLOWED_IMAGE = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(appError('JA-1003'), { status: 401 });

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json(appError('JA-2004'), { status: 400 }); }

  const type = ((formData.get('type') as string) ?? 'video').trim();
  const file = formData.get('file') as File | null;
  const caption = ((formData.get('caption') as string) ?? '').trim();
  const verseRef = ((formData.get('verse_reference') as string) ?? '').trim();
  const verseText = ((formData.get('verse_text') as string) ?? '').trim();

  if (!file) return NextResponse.json(appError('JA-8002'), { status: 400 });

  // ── IMAGE ────────────────────────────────────────────────────────────────
  if (type === 'image') {
    if (!ALLOWED_IMAGE.has(file.type))
      return NextResponse.json(appError('JA-2002'), { status: 400 });
    if (file.size > MAX_IMAGE_BYTES)
      return NextResponse.json(appError('JA-2001'), { status: 400 });
    if (!caption)
      return NextResponse.json(appError('JA-8002'), { status: 400 });

    // Magic-byte validation — guards against spoofed Content-Type
    const headerBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (!isMimeCompatible(file.type, sniffMime(headerBytes)))
      return NextResponse.json(appError('JA-2002'), { status: 400 });

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const storagePath = `${user.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      logError('JA-2003', uploadError);
      return NextResponse.json(appError('JA-2003'), { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(storagePath);

    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: caption,
        image_url: publicUrl,
        verse_reference: verseRef || null,
        verse_text: verseText || null,
      })
      .select('id')
      .single();

    if (insertError || !post) {
      await supabase.storage.from('images').remove([storagePath]);
      logError('JA-8005', insertError);
      return NextResponse.json(appError('JA-8005'), { status: 500 });
    }

    return NextResponse.json({ postId: post.id });
  }

  // ── VIDEO ────────────────────────────────────────────────────────────────
  if (!ALLOWED_VIDEO.has(file.type))
    return NextResponse.json(appError('JA-2002'), { status: 400 });
  if (file.size > MAX_VIDEO_BYTES)
    return NextResponse.json(appError('JA-2001'), { status: 400 });

  // Magic-byte validation — guards against spoofed Content-Type
  const videoHeader = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!isMimeCompatible(file.type, sniffMime(videoHeader)))
    return NextResponse.json(appError('JA-2002'), { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp4';
  const storagePath = `${user.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('videos')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    logError('JA-2003', uploadError);
    return NextResponse.json(appError('JA-2003'), { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(storagePath);

  const { data: video, error: insertError } = await supabase
    .from('videos')
    .insert({ user_id: user.id, url: publicUrl, caption: caption || null })
    .select('id')
    .single();

  if (insertError || !video) {
    await supabase.storage.from('videos').remove([storagePath]);
    logError('JA-8005', insertError);
    return NextResponse.json(appError('JA-8005'), { status: 500 });
  }

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

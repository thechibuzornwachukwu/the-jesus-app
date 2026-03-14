import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { appError, logError } from '../../../../lib/errors';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(appError('JA-1003'), { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const cellId = formData.get('cellId') as string | null;
  const channelId = formData.get('channelId') as string | null;

  if (!file || !cellId) {
    return NextResponse.json(appError('JA-8002'), { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(appError('JA-2002'), { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(appError('JA-2001'), { status: 400 });
  }

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
  const folder = channelId ? `${cellId}/${channelId}` : cellId;
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('chat-images')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    logError('JA-2003', uploadError);
    return NextResponse.json(appError('JA-2003'), { status: 500 });
  }

  const { data: signedData, error: signError } = await supabase.storage
    .from('chat-images')
    .createSignedUrl(path, 3600);

  if (signError || !signedData?.signedUrl) {
    logError('JA-2003', signError);
    return NextResponse.json(appError('JA-2003'), { status: 500 });
  }

  return NextResponse.json({ signedUrl: signedData.signedUrl, path });
}

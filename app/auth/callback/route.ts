import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/explore';

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Upsert profile immediately so it exists before the app renders
      const user = sessionData?.user;
      if (user) {
        const { id, email, user_metadata } = user;
        const { error: upsertError } = await supabase.from('profiles').upsert(
          {
            id,
            email: email ?? '',
            username:
              user_metadata?.preferred_username ??
              user_metadata?.user_name ??
              user_metadata?.username ??
              email?.split('@')[0] ??
              id.slice(0, 8),
            avatar_url: user_metadata?.avatar_url ?? user_metadata?.picture ?? '',
            display_name: user_metadata?.full_name ?? user_metadata?.name ?? '',
          },
          { onConflict: 'id', ignoreDuplicates: true },
        );
        if (upsertError) {
          console.error('[auth/callback] profile upsert failed:', upsertError.message);
          return NextResponse.redirect(`${origin}/sign-in?error=setup_failed`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed  redirect to sign-in with no error detail leaked
  return NextResponse.redirect(`${origin}/sign-in`);
}

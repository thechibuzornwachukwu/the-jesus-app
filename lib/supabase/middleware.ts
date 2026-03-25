import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session  do not remove this call
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Already signed in  redirect away from auth pages
  if (user && (pathname === '/sign-in' || pathname === '/sign-up')) {
    const url = request.nextUrl.clone();
    url.pathname = '/explore';
    return NextResponse.redirect(url);
  }

  // Profile-guard: authenticated users without a profile row → /setup-profile
  // Skip the check for public/auth routes and setup-profile itself to avoid redirect loops.
  const isPublicPath =
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname === '/setup-profile' ||
    pathname.startsWith('/auth');

  if (user && !isPublicPath) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const url = request.nextUrl.clone();
      url.pathname = '/setup-profile';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

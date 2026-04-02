'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '../supabase/server';
import { appError, logError } from '../errors';

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signIn(_: unknown, formData: FormData) {
  const parsed = authSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return appError('JA-8002');

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    logError('JA-1001', error);
    return appError('JA-1001');
  }

  // Upsert profile at sign-in so it always exists before the app loads
  if (signInData.user) {
    const { id, email, user_metadata } = signInData.user;
    const { error: upsertError } = await supabase.from('profiles').upsert(
      {
        id,
        username: user_metadata?.username ?? email?.split('@')[0]?.replace(/[^a-z0-9_]/gi, '').toLowerCase() ?? id.slice(0, 8),
        avatar_url: user_metadata?.avatar_url ?? '',
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (upsertError) {
      logError('JA-8005', upsertError);
      return appError('JA-8005');
    }
  }

  redirect('/explore');
}

export async function signUp(_: unknown, formData: FormData) {
  const parsed = authSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return appError('JA-8002');

  const acceptPolicies = formData.get('acceptPolicies');
  if (acceptPolicies !== 'true' && acceptPolicies !== 'on') return appError('JA-8002');

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    logError('JA-1002', error);
    return appError('JA-1002');
  }

  return { success: 'Check your email to confirm your account.' };
}

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' as const, user: null };
  return { error: null, user };
}

export async function signInWithMagicLink(_: unknown, formData: FormData) {
  const email = formData.get('email');
  const parsed = z.string().email().safeParse(email);
  if (!parsed.success) return appError('JA-8002');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    logError('JA-1004', error);
    return appError('JA-1004');
  }

  return { success: 'Magic link sent! Check your email.' };
}

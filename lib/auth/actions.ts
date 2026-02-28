'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '../supabase/server';

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signIn(_: unknown, formData: FormData) {
  const parsed = authSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: 'Invalid email or password.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Generic message — no info leakage
    return { error: 'Sign in failed. Check your credentials and try again.' };
  }

  redirect('/engage');
}

export async function signUp(_: unknown, formData: FormData) {
  const parsed = authSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: 'Please enter a valid email and a password of at least 8 characters.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: 'Sign up failed. Please try again.' };
  }

  return { success: 'Check your email to confirm your account.' };
}

export async function signInWithMagicLink(_: unknown, formData: FormData) {
  const email = formData.get('email');
  const parsed = z.string().email().safeParse(email);
  if (!parsed.success) {
    return { error: 'Please enter a valid email address.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: 'Failed to send magic link. Please try again.' };
  }

  return { success: 'Magic link sent! Check your email.' };
}

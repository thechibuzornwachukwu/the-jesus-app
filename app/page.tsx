import { createClient } from '../lib/supabase/server';
import { redirect } from 'next/navigation';
import LandingPage from '../libs/landing/LandingPage';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  bad_oauth_state: 'Your sign-in session expired. Please try again.',
  access_denied:   'Sign-in was cancelled.',
  server_error:    'A server error occurred. Please try again.',
};

function friendlyOAuthError(params: { error?: string; error_code?: string; error_description?: string }): string | undefined {
  if (!params.error && !params.error_code) return undefined;
  const code = params.error_code ?? params.error ?? '';
  return OAUTH_ERROR_MESSAGES[code] ?? (params.error_description ? decodeURIComponent(params.error_description.replace(/\+/g, ' ')) : 'Sign-in failed. Please try again.');
}

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/explore');

  const params = await searchParams;
  const oauthError = friendlyOAuthError(params);

  return <LandingPage oauthError={oauthError} />;
}

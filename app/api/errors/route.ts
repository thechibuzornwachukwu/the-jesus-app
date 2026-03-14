import { NextResponse } from 'next/server';

/**
 * Stage 5B — Dev Error Registry
 * GET /api/errors
 *
 * Returns the full JA error code registry as JSON.
 * Protected by DEV_SECRET env var — only reachable in non-production
 * environments or when the correct secret is supplied.
 *
 * Usage:
 *   curl http://localhost:3000/api/errors?secret=<DEV_SECRET>
 */

const REGISTRY: Record<
  string,
  { httpStatus: number; message: string; hint: string; recoverable: boolean }
> = {
  'JA-0400': {
    httpStatus: 400,
    message: 'Bad request',
    hint: 'The request payload is missing required fields or is malformed.',
    recoverable: true,
  },
  'JA-0401': {
    httpStatus: 401,
    message: 'Unauthorized',
    hint: 'User is not authenticated. Redirect to /auth/sign-in.',
    recoverable: true,
  },
  'JA-0403': {
    httpStatus: 403,
    message: 'Forbidden',
    hint: 'Authenticated but lacking the required role or permission.',
    recoverable: false,
  },
  'JA-0404': {
    httpStatus: 404,
    message: 'Page not found',
    hint: 'Route does not exist. app/not-found.tsx is rendered automatically.',
    recoverable: true,
  },
  'JA-0409': {
    httpStatus: 409,
    message: 'Conflict',
    hint: 'Duplicate resource — e.g. slug collision, duplicate invite code.',
    recoverable: true,
  },
  'JA-0413': {
    httpStatus: 413,
    message: 'Payload too large',
    hint: 'File upload exceeds limit (video: 100 MB, avatar: 5 MB).',
    recoverable: true,
  },
  'JA-0422': {
    httpStatus: 422,
    message: 'Unprocessable entity',
    hint: 'Zod validation failed — check field-level errors in the response body.',
    recoverable: true,
  },
  'JA-0429': {
    httpStatus: 429,
    message: 'Rate limited',
    hint: 'Too many requests. Vercel edge rate-limit or Supabase RLS policy triggered.',
    recoverable: true,
  },
  'JA-0500': {
    httpStatus: 500,
    message: 'Unexpected server error',
    hint: 'Unhandled exception. app/error.tsx is rendered automatically. Check digest for Vercel log correlation.',
    recoverable: true,
  },
  'JA-0502': {
    httpStatus: 502,
    message: 'Bad gateway',
    hint: 'Upstream service (Supabase, OpenAI) returned an unexpected response.',
    recoverable: true,
  },
  'JA-0503': {
    httpStatus: 503,
    message: 'Service unavailable',
    hint: 'Upstream service is down or rate-limiting. Retry with exponential back-off.',
    recoverable: true,
  },
};

export async function GET(request: Request) {
  // Block in production unless secret matches
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const devSecret = process.env.DEV_SECRET;

  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && (!devSecret || secret !== devSecret)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(
    {
      registry: REGISTRY,
      count: Object.keys(REGISTRY).length,
      generatedAt: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      },
    }
  );
}

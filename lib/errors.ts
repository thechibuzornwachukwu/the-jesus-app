/**
 * lib/errors.ts
 * Structured error helpers used across server actions and API routes.
 */

const ERROR_MESSAGES: Record<string, string> = {
  'JA-0429': 'Too many requests. Please try again later.',
  'JA-1001': 'Invalid email or password.',
  'JA-1002': 'Could not create account. Please try again.',
  'JA-1003': 'You must be signed in to do that.',
  'JA-1004': 'Could not send magic link. Please try again.',
  'JA-2004': 'Invalid request.',
  'JA-8002': 'Invalid input. Please check your details.',
  'JA-8005': 'Could not update your profile. Please try again.',
};

export interface AppError {
  error: string;
  code: string;
}

/**
 * Returns a structured error object for client consumption.
 */
export function appError(code: string): AppError {
  return {
    error: ERROR_MESSAGES[code] ?? 'Something went wrong. Please try again.',
    code,
  };
}

/**
 * Logs an error with its code to the console (and optionally to a monitoring service).
 */
export function logError(code: string, err?: unknown): void {
  const message = err instanceof Error ? err.message : String(err ?? '');
  console.error(`[${code}]`, message);
}

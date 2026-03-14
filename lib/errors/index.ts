import { ERROR_REGISTRY } from './registry'

/** Returns a user-facing error payload. Safe to send to the client. */
export function appError(code: string): { error: string; code: string } {
  const entry = ERROR_REGISTRY[code]
  if (!entry) {
    return { error: 'Something went wrong. Please try again.', code: 'JA-8001' }
  }
  return { error: entry.message, code }
}

/** Logs technical detail server-side. Never call from client components. */
export function logError(code: string, raw?: unknown): void {
  const entry = ERROR_REGISTRY[code]
  const technical = entry?.technical ?? 'Unknown error'
  const category = entry?.category ?? 'SERVER'
  console.error(`[${category}] ${code} — ${technical}`, raw ?? '')
}

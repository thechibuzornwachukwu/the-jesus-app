export type ErrorCategory =
  | 'AUTH'
  | 'UPLOAD'
  | 'CHAT'
  | 'CELL'
  | 'EXPLORE'
  | 'LEARN'
  | 'PROFILE'
  | 'SERVER'

export interface ErrorEntry {
  message: string
  technical: string
  category: ErrorCategory
}

export const ERROR_REGISTRY: Record<string, ErrorEntry> = {
  // AUTH (1xxx)
  'JA-1001': { category: 'AUTH', message: 'Sign-in failed. Please try again.', technical: 'signInWithPassword returned error' },
  'JA-1002': { category: 'AUTH', message: 'Account creation failed. Please try again.', technical: 'signUp returned error' },
  'JA-1003': { category: 'AUTH', message: 'You must be signed in to do that.', technical: 'Session missing or expired' },
  'JA-1004': { category: 'AUTH', message: 'Password reset email could not be sent.', technical: 'resetPasswordForEmail returned error' },
  'JA-1005': { category: 'AUTH', message: 'Sign-out failed.', technical: 'signOut returned error' },

  // UPLOAD (2xxx)
  'JA-2001': { category: 'UPLOAD', message: 'File is too large. Maximum size is 100 MB.', technical: 'File exceeds 100MB limit' },
  'JA-2002': { category: 'UPLOAD', message: 'Unsupported file type.', technical: 'MIME type not in allowed list' },
  'JA-2003': { category: 'UPLOAD', message: 'Upload failed. Please check your connection and try again.', technical: 'Storage upload returned error' },
  'JA-2004': { category: 'UPLOAD', message: 'Could not read the uploaded file.', technical: 'formData parsing failed' },
  // EXPLORE (5xxx)
  'JA-5001': { category: 'EXPLORE', message: 'Could not load posts.', technical: 'videos/posts select failed' },
  'JA-5002': { category: 'EXPLORE', message: 'Could not load comments.', technical: 'comments select failed' },
  'JA-5003': { category: 'EXPLORE', message: 'Comment could not be posted.', technical: 'comments insert failed' },
  'JA-5004': { category: 'EXPLORE', message: 'Like could not be saved.', technical: 'likes upsert/delete failed' },
  'JA-5005': { category: 'EXPLORE', message: 'Verse could not be saved.', technical: 'saved_verses upsert failed' },
  'JA-5006': { category: 'EXPLORE', message: 'Video not found.', technical: 'videos select by id returned no rows' },

  // LEARN (6xxx)
  'JA-6001': { category: 'LEARN', message: 'AI guide is unavailable right now.', technical: 'OpenAI chat completion failed' },
  'JA-6002': { category: 'LEARN', message: 'Could not extract sermon notes.', technical: 'Whisper transcription or GPT extraction failed' },
  'JA-6003': { category: 'LEARN', message: 'Could not load course progress.', technical: 'course_progress select failed' },
  'JA-6004': { category: 'LEARN', message: 'Progress could not be saved.', technical: 'course_progress upsert failed' },
  'JA-6005': { category: 'LEARN', message: 'Could not generate course summary.', technical: 'GPT summary generation failed' },
  'JA-6006': { category: 'LEARN', message: 'Knowledge search failed.', technical: 'match_theology_docs RPC failed' },

  // PROFILE (7xxx)
  'JA-7001': { category: 'PROFILE', message: 'Could not load your profile.', technical: 'profiles select failed' },
  'JA-7002': { category: 'PROFILE', message: 'Profile could not be updated.', technical: 'profiles update failed' },
  'JA-7003': { category: 'PROFILE', message: 'Avatar upload failed.', technical: 'avatars bucket upload or profiles.avatar_url update failed' },
  'JA-7004': { category: 'PROFILE', message: 'Could not load notifications.', technical: 'notifications select failed' },
  'JA-7005': { category: 'PROFILE', message: 'Could not load saved verses.', technical: 'saved_verses select failed' },
  'JA-7006': { category: 'PROFILE', message: 'Account deletion failed. Please contact support.', technical: 'profiles soft-delete update failed' },
  'JA-7007': { category: 'PROFILE', message: 'Push notifications could not be enabled.', technical: 'push_subscriptions upsert failed' },

  // RATE LIMIT (0xxx)
  'JA-0429': { category: 'SERVER', message: 'Too many requests. Please wait before trying again.', technical: 'Sliding-window rate limit exceeded (Upstash or in-process)' },

  // SERVER (8xxx)
  'JA-8001': { category: 'SERVER', message: 'Something went wrong. Please try again.', technical: 'Unhandled server exception' },
  'JA-8002': { category: 'SERVER', message: 'Request is missing required fields.', technical: 'Zod or manual validation failed' },
  'JA-8003': { category: 'SERVER', message: 'You are not authorised to access this.', technical: 'CRON_SECRET or role check failed' },
  'JA-8004': { category: 'SERVER', message: 'Service is temporarily unavailable.', technical: 'External API (OpenAI / Supabase) returned 5xx' },
  'JA-8005': { category: 'SERVER', message: 'Database error. Please try again.', technical: 'Supabase query returned PostgreSQL error' },
}

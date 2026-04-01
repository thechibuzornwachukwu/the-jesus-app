'use server';

// Stub — full implementation wired in Phase 8
export async function logDailyEngagement(userId: string): Promise<void> {
  void userId;
}

export type StreakEventType =
  | 'verse_save'
  | 'verse_save_with_note'
  | 'post'
  | 'image_post'
  | 'comment'
  | 'chat_message'
  | 'course_complete';

export async function logStreakEvent(_event: StreakEventType): Promise<void> {
  // Stub — full streak logic wired in Phase 8
}

export async function getStreakData(): Promise<{ current: number; longest: number }> {
  return { current: 0, longest: 0 };
}

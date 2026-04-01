export interface CourseProgress {
  track_id: string;
  lesson_index: number;
  completed: boolean;
  completed_at: string | null;
}

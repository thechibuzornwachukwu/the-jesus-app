export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  scripture: string;   // reference, e.g. "John 3:16"
  verse: string;       // full verse text
  body: string;        // 2-3 sentence teaching
  reflection: string;  // one reflection question
}

export interface CourseTrack {
  id: string;
  title: string;
  icon?: string;       // unused  icon resolved from id in FaithCourses
  image?: string;      // path to background photo in /public/courses/
  description: string;
  lessons: CourseLesson[];
}

export interface CourseProgress {
  track_id: string;
  lesson_idx: number;
  completed: boolean;
}

export interface SermonNotes {
  summary: string;
  keyPoints: string[];
  scriptures: string[];
  themes: string[];
  actionItems: string[];
}

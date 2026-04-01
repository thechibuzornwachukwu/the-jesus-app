export type TestimonyCategory =
  | 'Salvation'
  | 'Healing'
  | 'Provision'
  | 'Breakthrough'
  | 'Restoration'
  | 'Deliverance'
  | 'Marriage'
  | 'Protection';

export type ReactionType = 'amen' | 'praying' | 'thankful';

export interface TestimonyAuthor {
  id: string;
  username: string;
  avatar_url?: string;
}

export interface Testimony {
  id: string;
  title: string;
  category: TestimonyCategory;
  full_story: string;
  media_url?: string;
  show_streak: boolean;
  streak_days?: number;
  author: TestimonyAuthor;
  reaction_counts: Record<ReactionType, number>;
  user_reaction: ReactionType | null;
  created_at: string;
}
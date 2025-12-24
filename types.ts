
export type Category = 'Health' | 'Productivity' | 'Mindfulness' | 'Social' | 'Finance' | 'Other';
export type Duration = 'week' | 'month';

export interface Habit {
  id: string;
  name: string;
  category: Category;
  description: string;
  frequency: 'daily' | 'weekly';
  duration: Duration;
  emoji: string;
  startDate: string; // YYYY-MM-DD
  createdAt: number;
  color: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  note?: string; // Journal entry for the day
}

export interface HabitInsight {
  summary: string;
  recommendations: string[];
  encouragement: string;
}

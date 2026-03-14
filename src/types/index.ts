export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "done" | "cancelled";
export type EventSource = "manual" | "google" | "apple" | "ics";
export type CategoryType = "task" | "event" | "both";
export type Mood = "great" | "good" | "neutral" | "bad" | "terrible";
export type Theme = "light" | "dark" | "system";
export type WeekStart = 0 | 1;

export interface Task {
  id: string;
  title: string;
  description?: string;
  /** yyyy-MM-dd — data agendada */
  date: string;
  deadline?: string;
  priority: Priority;
  status: TaskStatus;
  categoryId?: string;
  linkedEventId?: string;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DailyLog {
  date: string;
  content: string;
  mood?: Mood;
  createdAt: number;
  updatedAt: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startAt: number;
  endAt: number;
  allDay?: boolean;
  location?: string;
  categoryId?: string;
  source: EventSource;
  externalId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WeeklyGoal {
  id: string;
  weekKey: string;
  title: string;
  description?: string;
  target: number;
  progress: number;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: CategoryType;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: number;
}

export interface UserSettings {
  timezone: string;
  theme: Theme;
  startOfWeek: WeekStart;
  defaultView: "month" | "week" | "day";
  showWeekNumbers: boolean;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

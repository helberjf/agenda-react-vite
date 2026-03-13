/**
 * types/index.ts
 *
 * Tipos de domínio centrais da aplicação.
 * Firebase Realtime Database usa strings ISO para timestamps —
 * internamente usamos number (Unix ms) para performance de comparação.
 */

// ─── Enums ──────────────────────────────────────────────────────────────────

export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "done" | "cancelled";
export type EventSource = "manual" | "google" | "apple" | "ics";
export type CategoryType = "task" | "event" | "both";
export type Mood = "great" | "good" | "neutral" | "bad" | "terrible";
export type Theme = "light" | "dark" | "system";
export type WeekStart = 0 | 1; // 0 = Domingo, 1 = Segunda

// ─── Task ────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description?: string;
  /** yyyy-MM-dd — presente se isDaily */
  date?: string;
  /** "yyyy-Www" ex: "2024-W03" — presente se isWeekly */
  weekKey?: string;
  priority: Priority;
  status: TaskStatus;
  categoryId?: string;
  isDaily: boolean;
  isWeekly: boolean;
  /** Pode gerar um evento no calendário */
  linkedEventId?: string;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

// ─── DailyLog ────────────────────────────────────────────────────────────────

export interface DailyLog {
  date: string; // yyyy-MM-dd
  content: string;
  mood?: Mood;
  createdAt: number;
  updatedAt: number;
}

// ─── Event ───────────────────────────────────────────────────────────────────

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
  /** ID no calendário externo (Google/Apple) */
  externalId?: string;
  createdAt: number;
  updatedAt: number;
}

// ─── WeeklyGoal ──────────────────────────────────────────────────────────────

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

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  color: string; // hex
  type: CategoryType;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: number;
}

export interface UserSettings {
  timezone: string; // ex: "America/Sao_Paulo"
  theme: Theme;
  startOfWeek: WeekStart;
  defaultView: "month" | "week" | "day";
  showWeekNumbers: boolean;
}

// ─── Calendar Integration ────────────────────────────────────────────────────

export interface CalendarIntegration {
  provider: "google" | "apple" | "caldav";
  syncEnabled: boolean;
  lastSyncedAt?: number;
  externalCalendarId?: string;
  /** URL CalDAV — usado para Apple/iCloud */
  caldavUrl?: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

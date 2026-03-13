import { ref, get, onValue, query, orderByChild, startAt, endAt } from "firebase/database";
import { database } from "@/lib/firebase";
import { api } from "@/lib/api";
import type { CalendarEvent } from "@/types";
import type { CreateEventInput, UpdateEventInput } from "@/lib/validators/event";

const eventsRef = (uid: string) => ref(database, `events/${uid}`);

export async function createEvent(_uid: string, input: CreateEventInput): Promise<CalendarEvent> {
  const { event } = await api.post<{ event: CalendarEvent }>("/events", input);
  return event;
}

export async function updateEvent(_uid: string, eventId: string, input: UpdateEventInput): Promise<void> {
  await api.patch(`/events/${eventId}`, input);
}

export async function deleteEvent(_uid: string, eventId: string): Promise<void> {
  await api.delete(`/events/${eventId}`);
}

export async function getAllEvents(uid: string): Promise<CalendarEvent[]> {
  const snap = await get(eventsRef(uid));
  if (!snap.exists()) return [];
  return Object.values(snap.val()) as CalendarEvent[];
}

export function subscribeEvents(
  uid: string, startTs: number, endTs: number,
  callback: (events: CalendarEvent[]) => void
): () => void {
  const q = query(eventsRef(uid), orderByChild("startAt"), startAt(startTs), endAt(endTs));
  return onValue(q,
    (snap) => callback(snap.exists() ? Object.values(snap.val()) as CalendarEvent[] : []),
    () => callback([])
  );
}

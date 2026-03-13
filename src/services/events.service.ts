import {
  ref, get, onValue, query, orderByChild, startAt, endAt,
} from "firebase/database";
import { database } from "@/lib/firebase";
import { fnCreateEvent, fnUpdateEvent, fnDeleteEvent } from "@/lib/functions";
import type { CalendarEvent } from "@/types";
import type { CreateEventInput, UpdateEventInput } from "@/lib/validators/event";

const eventsRef = (uid: string) => ref(database, `events/${uid}`);

export async function createEvent(uid: string, input: CreateEventInput): Promise<CalendarEvent> {
  const result = await fnCreateEvent({ ...input, uid });
  return result.data.event as CalendarEvent;
}

export async function updateEvent(uid: string, eventId: string, input: UpdateEventInput): Promise<void> {
  await fnUpdateEvent({ eventId, uid, ...input });
}

export async function deleteEvent(uid: string, eventId: string): Promise<void> {
  await fnDeleteEvent({ eventId, uid });
}

export async function getEventsByRange(uid: string, startTs: number, endTs: number): Promise<CalendarEvent[]> {
  const q = query(eventsRef(uid), orderByChild("startAt"), startAt(startTs), endAt(endTs));
  const snap = await get(q);
  if (!snap.exists()) return [];
  return Object.values(snap.val()) as CalendarEvent[];
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
  const unsubscribe = onValue(q,
    (snap) => {
      callback(snap.exists() ? Object.values(snap.val()) as CalendarEvent[] : []);
    },
    () => callback([])
  );
  return unsubscribe;
}

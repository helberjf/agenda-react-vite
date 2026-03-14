import { api } from "@/lib/api";
import type { CalendarEvent } from "@/types";
import type { CreateEventInput, UpdateEventInput } from "@/lib/validators/event";

function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.startAt - b.startAt);
}

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
  void uid;
  const { events } = await api.get<{ events: CalendarEvent[] }>("/events");
  return sortEvents(events);
}

export async function getEventsInRange(
  uid: string,
  startTs: number,
  endTs: number
): Promise<CalendarEvent[]> {
  void uid;
  const { events } = await api.get<{ events: CalendarEvent[] }>("/events", {
    start: String(startTs),
    end: String(endTs),
  });
  return sortEvents(events);
}

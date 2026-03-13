import * as functions from "firebase-functions";
import { db } from "./lib/admin";
import { requireAuth } from "./lib/auth";
import { assertString, assertNumber, cleanObject } from "./lib/validate";

interface EventData {
  id: string;
  title: string;
  description?: string;
  startAt: number;
  endAt: number;
  allDay: boolean;
  location?: string;
  categoryId?: string;
  source: string;
  externalId?: string;
  createdAt: number;
  updatedAt: number;
}

export const createEvent = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    const { uid } = requireAuth(context);

    const title = assertString(data.title, "title");
    const startAt = assertNumber(data.startAt, "startAt");
    const endAt = assertNumber(data.endAt, "endAt");

    if (endAt < startAt) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "endAt deve ser maior ou igual a startAt."
      );
    }

    const eventRef = db.ref(`events/${uid}`).push();
    const eventId = eventRef.key!;
    const now = Date.now();

    const event = cleanObject<EventData>({
      id: eventId,
      title,
      description: data.description || undefined,
      startAt,
      endAt,
      allDay: data.allDay === true,
      location: data.location || undefined,
      categoryId: data.categoryId || undefined,
      source: "manual",
      createdAt: now,
      updatedAt: now,
    }) as EventData;

    await db.ref(`events/${uid}/${eventId}`).set(event);
    return { event };
  });

export const updateEvent = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    const { uid } = requireAuth(context);
    const eventId = assertString(data.eventId, "eventId");

    const existing = await db.ref(`events/${uid}/${eventId}`).get();
    if (!existing.exists()) {
      throw new functions.https.HttpsError("not-found", "Evento não encontrado.");
    }

    const prev = existing.val() as EventData;
    const updated = cleanObject<EventData>({
      ...prev,
      ...(data.title ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description || undefined } : {}),
      ...(data.startAt ? { startAt: data.startAt } : {}),
      ...(data.endAt ? { endAt: data.endAt } : {}),
      ...(data.location !== undefined ? { location: data.location || undefined } : {}),
      updatedAt: Date.now(),
    }) as EventData;

    await db.ref(`events/${uid}/${eventId}`).set(updated);
    return { success: true };
  });

export const deleteEvent = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    const { uid } = requireAuth(context);
    const eventId = assertString(data.eventId, "eventId");

    await db.ref(`events/${uid}/${eventId}`).remove();
    return { success: true };
  });

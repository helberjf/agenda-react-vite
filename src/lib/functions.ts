/**
 * lib/functions.ts
 *
 * Cliente para chamar Cloud Functions do frontend.
 * httpsCallable envia o token Firebase automaticamente no header.
 * A function server-side verifica o token antes de executar.
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { app } from "@/lib/firebase";

const functions = getFunctions(app, "us-central1");

// Emulador local
if (import.meta.env.VITE_USE_EMULATORS === "true") {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

// ─── Task functions ───────────────────────────────────────────────────────────

export const fnCreateTask = httpsCallable<unknown, { task: unknown }>(
  functions, "createTask"
);

export const fnUpdateTask = httpsCallable<unknown, { success: boolean }>(
  functions, "updateTask"
);

export const fnCompleteTask = httpsCallable<unknown, { success: boolean }>(
  functions, "completeTask"
);

export const fnUncompleteTask = httpsCallable<unknown, { success: boolean }>(
  functions, "uncompleteTask"
);

export const fnDeleteTask = httpsCallable<unknown, { success: boolean }>(
  functions, "deleteTask"
);

// ─── Event functions ──────────────────────────────────────────────────────────

export const fnCreateEvent = httpsCallable<unknown, { event: unknown }>(
  functions, "createEvent"
);

export const fnUpdateEvent = httpsCallable<unknown, { success: boolean }>(
  functions, "updateEvent"
);

export const fnDeleteEvent = httpsCallable<unknown, { success: boolean }>(
  functions, "deleteEvent"
);

// ─── Log functions ────────────────────────────────────────────────────────────

export const fnUpsertDailyLog = httpsCallable<unknown, { log: unknown }>(
  functions, "upsertDailyLog"
);

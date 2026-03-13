import * as functions from "firebase-functions";
import { db } from "./lib/admin";
import { requireAuth } from "./lib/auth";
import { assertString, cleanObject } from "./lib/validate";

interface DailyLog {
  date: string;
  content: string;
  mood?: string;
  createdAt: number;
  updatedAt: number;
}

export const upsertDailyLog = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    const { uid } = requireAuth(context);

    const date = assertString(data.date, "date");
    const content = assertString(data.content, "content");

    if (content.length > 10000) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Conteúdo muito longo."
      );
    }

    const existing = await db.ref(`dailyLogs/${uid}/${date}`).get();
    const now = Date.now();

    const log = cleanObject<DailyLog>({
      date,
      content,
      mood: data.mood || undefined,
      createdAt: existing.exists() ? existing.val().createdAt : now,
      updatedAt: now,
    }) as DailyLog;

    await db.ref(`dailyLogs/${uid}/${date}`).set(log);
    return { log };
  });

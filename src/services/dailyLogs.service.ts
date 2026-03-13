import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { api } from "@/lib/api";
import type { DailyLog } from "@/types";
import type { DailyLogInput } from "@/lib/validators/auth";

const logRef = (uid: string, dateKey: string) =>
  ref(database, `dailyLogs/${uid}/${dateKey}`);

export async function upsertDailyLog(_uid: string, dateKey: string, input: DailyLogInput): Promise<DailyLog> {
  const { log } = await api.put<{ log: DailyLog }>(`/logs/${dateKey}`, input);
  return log;
}

export function subscribeDailyLog(
  uid: string, dateKey: string,
  callback: (log: DailyLog | null) => void
): () => void {
  return onValue(logRef(uid, dateKey),
    (snap) => callback(snap.exists() ? snap.val() as DailyLog : null),
    () => callback(null)
  );
}

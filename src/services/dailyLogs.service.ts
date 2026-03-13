import { ref, get, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { fnUpsertDailyLog } from "@/lib/functions";
import type { DailyLog } from "@/types";
import type { DailyLogInput } from "@/lib/validators/auth";

const logRef = (uid: string, dateKey: string) =>
  ref(database, `dailyLogs/${uid}/${dateKey}`);

export async function upsertDailyLog(uid: string, dateKey: string, input: DailyLogInput): Promise<DailyLog> {
  const result = await fnUpsertDailyLog({ date: dateKey, uid, ...input });
  return result.data.log as DailyLog;
}

export async function getDailyLog(uid: string, dateKey: string): Promise<DailyLog | null> {
  const snap = await get(logRef(uid, dateKey));
  return snap.exists() ? snap.val() as DailyLog : null;
}

export function subscribeDailyLog(
  uid: string, dateKey: string,
  callback: (log: DailyLog | null) => void
): () => void {
  const r = logRef(uid, dateKey);
  const unsubscribe = onValue(r,
    (snap) => callback(snap.exists() ? snap.val() as DailyLog : null),
    () => callback(null)
  );
  return unsubscribe;
}

export async function getRecentLogs(uid: string, dateKeys: string[]): Promise<DailyLog[]> {
  const snaps = await Promise.all(dateKeys.map((d) => get(logRef(uid, d))));
  return snaps.filter((s) => s.exists()).map((s) => s.val() as DailyLog);
}

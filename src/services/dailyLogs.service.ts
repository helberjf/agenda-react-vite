import { api } from "@/lib/api";
import type { DailyLog } from "@/types";
import type { DailyLogInput } from "@/lib/validators/auth";

export async function getDailyLog(_uid: string, dateKey: string): Promise<DailyLog | null> {
  const { log } = await api.get<{ log: DailyLog | null }>(`/logs/${dateKey}`);
  return log;
}

export async function getDailyLogs(_uid: string, month?: string): Promise<DailyLog[]> {
  const { logs } = await api.get<{ logs: DailyLog[] }>("/logs", month ? { month } : undefined);
  return logs;
}

export async function upsertDailyLog(_uid: string, dateKey: string, input: DailyLogInput): Promise<DailyLog> {
  const { log } = await api.put<{ log: DailyLog }>(`/logs/${dateKey}`, input);
  return log;
}

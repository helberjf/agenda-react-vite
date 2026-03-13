import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { subscribeDailyLog, upsertDailyLog } from "@/services/dailyLogs.service";
import { toDateKey } from "@/lib/utils/date";
import type { DailyLog } from "@/types";
import type { DailyLogInput } from "@/lib/validators/auth";

export function useDailyLog(date: Date = new Date()) {
  const uid = useAuthStore((s) => s.user?.uid);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  const dateKey = toDateKey(date);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const unsubscribe = subscribeDailyLog(uid, dateKey, (l) => {
      setLog(l);
      setLoading(false);
    });
    return unsubscribe;
  }, [uid, dateKey]);

  return { log, loading, dateKey };
}

export function useUpsertDailyLog() {
  const uid = useAuthStore((s) => s.user?.uid);

  return useMutation({
    mutationFn: ({ dateKey, input }: { dateKey: string; input: DailyLogInput }) =>
      upsertDailyLog(uid!, dateKey, input),
  });
}

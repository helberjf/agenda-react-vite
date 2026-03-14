import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { getDailyLog, getDailyLogs, upsertDailyLog } from "@/services/dailyLogs.service";
import { toDateKey } from "@/lib/utils/date";
import type { DailyLogInput } from "@/lib/validators/auth";

const LOGS_STALE_TIME = 30 * 1000;

export function useDailyLog(date: Date = new Date()) {
  const uid = useAuthStore((s) => s.user?.uid);
  const dateKey = toDateKey(date);

  const { data: log = null, isLoading } = useQuery({
    queryKey: ["logs", "date", uid, dateKey],
    queryFn: () => getDailyLog(uid!, dateKey),
    enabled: !!uid,
    staleTime: LOGS_STALE_TIME,
  });

  return { log, loading: isLoading, dateKey };
}

export function useDailyLogs(month?: string) {
  const uid = useAuthStore((s) => s.user?.uid);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["logs", "list", uid, month ?? "all"],
    queryFn: () => getDailyLogs(uid!, month),
    enabled: !!uid,
    staleTime: LOGS_STALE_TIME,
  });

  return { logs, loading: isLoading };
}

export function useUpsertDailyLog() {
  const uid = useAuthStore((s) => s.user?.uid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dateKey, input }: { dateKey: string; input: DailyLogInput }) =>
      upsertDailyLog(uid!, dateKey, input),
    onSuccess: (_log, { dateKey }) => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: ["logs", "date", uid, dateKey] });
    },
  });
}

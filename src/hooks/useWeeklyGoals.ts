import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import {
  subscribeWeeklyGoals,
  createWeeklyGoal,
  updateGoalProgress,
  deleteWeeklyGoal,
} from "@/services/weeklyGoals.service";
import { toWeekKey } from "@/lib/utils/date";
import type { WeeklyGoal } from "@/types";
import type { WeeklyGoalInput } from "@/lib/validators/auth";

export function useWeeklyGoals(date: Date = new Date()) {
  const uid = useAuthStore((s) => s.user?.uid);
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const weekKey = toWeekKey(date);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const unsubscribe = subscribeWeeklyGoals(uid, weekKey, (g) => {
      setGoals(g);
      setLoading(false);
    });
    return unsubscribe;
  }, [uid, weekKey]);

  return { goals, loading, weekKey };
}

export function useCreateWeeklyGoal(weekKey: string) {
  const uid = useAuthStore((s) => s.user?.uid);
  return useMutation({
    mutationFn: (input: WeeklyGoalInput) => createWeeklyGoal(uid!, weekKey, input),
  });
}

export function useUpdateGoalProgress(weekKey: string) {
  const uid = useAuthStore((s) => s.user?.uid);
  return useMutation({
    mutationFn: ({ goalId, progress }: { goalId: string; progress: number }) =>
      updateGoalProgress(uid!, weekKey, goalId, progress),
  });
}

export function useDeleteWeeklyGoal(weekKey: string) {
  const uid = useAuthStore((s) => s.user?.uid);
  return useMutation({
    mutationFn: (goalId: string) => deleteWeeklyGoal(uid!, weekKey, goalId),
  });
}

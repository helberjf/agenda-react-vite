import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, startOfWeek } from "date-fns";
import { useAuthStore } from "@/store/auth.store";
import {
  createTask,
  updateTask,
  completeTask,
  uncompleteTask,
  deleteTask,
  getTasksByDate,
  getTasksInRange,
  getWeeklyTasks,
} from "@/services/tasks.service";
import { toDateKey } from "@/lib/utils/date";
import type { Task } from "@/types";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validators/task";

const TASKS_STALE_TIME = 30 * 1000;

export function useTodayTasks(date: Date = new Date()) {
  const uid = useAuthStore((s) => s.user?.uid);
  const dateKey = toDateKey(date);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", "date", uid, dateKey],
    queryFn: () => getTasksByDate(uid!, dateKey),
    enabled: !!uid,
    staleTime: TASKS_STALE_TIME,
  });

  return { tasks, loading: isLoading };
}

export function useWeeklyTasks(date: Date = new Date()) {
  const uid = useAuthStore((s) => s.user?.uid);
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const dateKeys = Array.from({ length: 7 }, (_, i) => toDateKey(addDays(weekStart, i)));

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", "week", uid, dateKeys.join(",")],
    queryFn: () => getWeeklyTasks(uid!, dateKeys),
    enabled: !!uid,
    staleTime: TASKS_STALE_TIME,
  });

  return { tasks, loading: isLoading, weekStart, dateKeys };
}

export function useTasksByDate(dateKey: string) {
  const uid = useAuthStore((s) => s.user?.uid);

  return useQuery({
    queryKey: ["tasks", "date", uid, dateKey],
    queryFn: () => getTasksByDate(uid!, dateKey),
    enabled: !!uid,
    staleTime: TASKS_STALE_TIME,
  });
}

export function useTasksInRange(startDate: string, endDate: string) {
  const uid = useAuthStore((s) => s.user?.uid);

  return useQuery({
    queryKey: ["tasks", "range", uid, startDate, endDate],
    queryFn: () => getTasksInRange(uid!, startDate, endDate),
    enabled: !!uid,
    staleTime: TASKS_STALE_TIME,
  });
}

export function useCreateTask() {
  const uid = useAuthStore((s) => s.user?.uid);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(uid!, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const uid = useAuthStore((s) => s.user?.uid);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      updateTask(uid!, taskId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useCompleteTask() {
  const uid = useAuthStore((s) => s.user?.uid);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => completeTask(uid!, taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUncompleteTask() {
  const uid = useAuthStore((s) => s.user?.uid);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => uncompleteTask(uid!, taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const uid = useAuthStore((s) => s.user?.uid);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (task: Task) => deleteTask(uid!, task.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

/**
 * hooks/useTasks.ts
 *
 * Hooks de tarefas combinando Firebase listeners com estado local.
 *
 * Estratégia:
 * - Listeners em tempo real via useEffect + useState para Today e Week
 *   (dados que mudam frequentemente enquanto o usuário está na tela)
 * - TanStack Query para Histórico (leitura pontual + cache)
 *
 * Por que não TanStack Query para listeners?
 * - TanStack Query é ótimo para fetch/refetch, mas listeners Firebase
 *   são push-based — o padrão correto é useState + useEffect.
 * - Misturar os dois cria complexidade desnecessária no MVP.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import {
  subscribeTodayTasks,
  subscribeWeeklyTasks,
  createTask,
  updateTask,
  completeTask,
  uncompleteTask,
  deleteTask,
  getTasksByDate,
} from "@/services/tasks.service";
import { toDateKey, toWeekKey } from "@/lib/utils/date";
import type { Task } from "@/types";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validators/task";

// ─── Listener: tarefas do dia ─────────────────────────────────────────────────

export function useTodayTasks(date: Date = new Date()) {
  const uid = useAuthStore((s) => s.user?.uid);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const dateKey = toDateKey(date);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);

    const unsubscribe = subscribeTodayTasks(uid, dateKey, (t) => {
      setTasks(t.sort((a, b) => {
        // Pendentes primeiro, depois por prioridade
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        if (a.status === "done" && b.status !== "done") return 1;
        if (a.status !== "done" && b.status === "done") return -1;
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }));
      setLoading(false);
    });

    return unsubscribe;
  }, [uid, dateKey]);

  return { tasks, loading };
}

// ─── Listener: tarefas da semana ──────────────────────────────────────────────

export function useWeeklyTasks(date: Date = new Date()) {
  const uid = useAuthStore((s) => s.user?.uid);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const weekKey = toWeekKey(date);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const unsubscribe = subscribeWeeklyTasks(uid, weekKey, (t) => {
      setTasks(t);
      setLoading(false);
    });
    return unsubscribe;
  }, [uid, weekKey]);

  return { tasks, loading, weekKey };
}

// ─── TanStack Query: histórico de tasks por data ──────────────────────────────

export function useTasksByDate(dateKey: string) {
  const uid = useAuthStore((s) => s.user?.uid);

  return useQuery({
    queryKey: ["tasks", "date", uid, dateKey],
    queryFn: () => getTasksByDate(uid!, dateKey),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000, // 5 min — histórico não muda muito
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateTask() {
  const uid = useAuthStore((s) => s.user?.uid);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(uid!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const uid = useAuthStore((s) => s.user?.uid);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input, previousTask }: {
      taskId: string;
      input: UpdateTaskInput;
      previousTask: Task;
    }) => updateTask(uid!, taskId, input, previousTask),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useCompleteTask() {
  const uid = useAuthStore((s) => s.user?.uid);

  return useMutation({
    mutationFn: (taskId: string) => completeTask(uid!, taskId),
  });
}

export function useUncompleteTask() {
  const uid = useAuthStore((s) => s.user?.uid);

  return useMutation({
    mutationFn: (taskId: string) => uncompleteTask(uid!, taskId),
  });
}

export function useDeleteTask() {
  const uid = useAuthStore((s) => s.user?.uid);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (task: Task) => deleteTask(uid!, task),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

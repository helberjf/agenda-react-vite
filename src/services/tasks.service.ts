/**
 * services/tasks.service.ts
 * ESCRITAS → API backend (Node/Vercel)
 * LEITURAS → Firebase Realtime Database direto (listeners em tempo real)
 */

import { ref, get, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { api } from "@/lib/api";
import type { Task } from "@/types";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validators/task";

const taskRef = (uid: string, taskId: string) =>
  ref(database, `tasks/${uid}/${taskId}`);

// ─── Escritas via API ─────────────────────────────────────────────────────────

export async function createTask(_uid: string, input: CreateTaskInput): Promise<Task> {
  const { task } = await api.post<{ task: Task }>("/tasks", input);
  return task;
}

export async function updateTask(
  _uid: string,
  taskId: string,
  input: UpdateTaskInput,
  _prev: Task
): Promise<void> {
  await api.patch(`/tasks/${taskId}`, input);
}

export async function completeTask(_uid: string, taskId: string): Promise<void> {
  await api.patch(`/tasks/${taskId}`, { action: "complete" });
}

export async function uncompleteTask(_uid: string, taskId: string): Promise<void> {
  await api.patch(`/tasks/${taskId}`, { action: "uncomplete" });
}

export async function deleteTask(_uid: string, task: Task): Promise<void> {
  await api.delete(`/tasks/${task.id}`);
}

// ─── Leituras pontuais (Histórico) ───────────────────────────────────────────

export async function getTasksByDate(uid: string, dateKey: string): Promise<Task[]> {
  const indexSnap = await get(ref(database, `dailyTasks/${uid}/${dateKey}`));
  if (!indexSnap.exists()) return [];
  const ids = Object.keys(indexSnap.val() as Record<string, boolean>);
  const snaps = await Promise.all(ids.map((id) => get(taskRef(uid, id))));
  return snaps.filter((s) => s.exists()).map((s) => s.val() as Task);
}

// ─── Listeners em tempo real ──────────────────────────────────────────────────

export function subscribeTodayTasks(
  uid: string,
  dateKey: string,
  callback: (tasks: Task[]) => void
): () => void {
  const unsubscribe = onValue(
    ref(database, `dailyTasks/${uid}/${dateKey}`),
    (snap) => {
      if (!snap.exists()) { callback([]); return; }
      const ids = Object.keys(snap.val() as Record<string, boolean>);
      Promise.all(ids.map((id) => get(taskRef(uid, id))))
        .then((snaps) => {
          const tasks = snaps
            .filter((s) => s.exists())
            .map((s) => s.val() as Task)
            .sort((a, b) => {
              const order = { urgent: 0, high: 1, medium: 2, low: 3 };
              if (a.status === "done" && b.status !== "done") return 1;
              if (a.status !== "done" && b.status === "done") return -1;
              return order[a.priority] - order[b.priority];
            });
          callback(tasks);
        })
        .catch(() => callback([]));
    },
    () => callback([])
  );
  return unsubscribe;
}

export function subscribeWeeklyTasks(
  uid: string,
  weekKey: string,
  callback: (tasks: Task[]) => void
): () => void {
  const unsubscribe = onValue(
    ref(database, `weeklyTasks/${uid}/${weekKey}`),
    (snap) => {
      if (!snap.exists()) { callback([]); return; }
      const ids = Object.keys(snap.val() as Record<string, boolean>);
      Promise.all(ids.map((id) => get(taskRef(uid, id))))
        .then((snaps) => callback(snaps.filter((s) => s.exists()).map((s) => s.val() as Task)))
        .catch(() => callback([]));
    },
    () => callback([])
  );
  return unsubscribe;
}

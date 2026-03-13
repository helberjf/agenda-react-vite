/**
 * services/tasks.service.ts
 *
 * ESCRITAS: via Cloud Functions (servidor valida token e dados)
 * LEITURAS: direto no Realtime Database (protegidas por Security Rules)
 */

import { ref, get, onValue, update } from "firebase/database";
import { database } from "@/lib/firebase";
import {
  fnCreateTask,
  fnUpdateTask,
  fnCompleteTask,
  fnUncompleteTask,
  fnDeleteTask,
} from "@/lib/functions";
import type { Task } from "@/types";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validators/task";

const taskRef = (uid: string, taskId: string) =>
  ref(database, `tasks/${uid}/${taskId}`);

// ─── Escritas via Cloud Functions ─────────────────────────────────────────────

export async function createTask(uid: string, input: CreateTaskInput): Promise<Task> {
  const result = await fnCreateTask({ ...input, uid });
  return result.data.task as Task;
}

export async function updateTask(
  uid: string,
  taskId: string,
  input: UpdateTaskInput,
  _previousTask: Task
): Promise<void> {
  await fnUpdateTask({ taskId, uid, ...input });
}

export async function completeTask(uid: string, taskId: string): Promise<void> {
  await fnCompleteTask({ taskId, uid });
}

export async function uncompleteTask(uid: string, taskId: string): Promise<void> {
  await fnUncompleteTask({ taskId, uid });
}

export async function deleteTask(uid: string, task: Task): Promise<void> {
  await fnDeleteTask({ taskId: task.id, uid });
}

// ─── Leituras diretas no DB ───────────────────────────────────────────────────

export async function getTasksByDate(uid: string, dateKey: string): Promise<Task[]> {
  const indexSnap = await get(ref(database, `dailyTasks/${uid}/${dateKey}`));
  if (!indexSnap.exists()) return [];

  const ids = Object.keys(indexSnap.val() as Record<string, boolean>);
  const taskSnaps = await Promise.all(ids.map((id) => get(taskRef(uid, id))));
  return taskSnaps.filter((s) => s.exists()).map((s) => s.val() as Task);
}

export async function getTasksByWeek(uid: string, weekKey: string): Promise<Task[]> {
  const indexSnap = await get(ref(database, `weeklyTasks/${uid}/${weekKey}`));
  if (!indexSnap.exists()) return [];

  const ids = Object.keys(indexSnap.val() as Record<string, boolean>);
  const taskSnaps = await Promise.all(ids.map((id) => get(taskRef(uid, id))));
  return taskSnaps.filter((s) => s.exists()).map((s) => s.val() as Task);
}

// ─── Listeners em tempo real ──────────────────────────────────────────────────

export function subscribeTodayTasks(
  uid: string,
  dateKey: string,
  callback: (tasks: Task[]) => void
): () => void {
  const indexPath = ref(database, `dailyTasks/${uid}/${dateKey}`);

  const unsubscribe = onValue(
    indexPath,
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
  const indexPath = ref(database, `weeklyTasks/${uid}/${weekKey}`);

  const unsubscribe = onValue(
    indexPath,
    (snap) => {
      if (!snap.exists()) { callback([]); return; }

      const ids = Object.keys(snap.val() as Record<string, boolean>);
      Promise.all(ids.map((id) => get(taskRef(uid, id))))
        .then((snaps) => {
          callback(snaps.filter((s) => s.exists()).map((s) => s.val() as Task));
        })
        .catch(() => callback([]));
    },
    () => callback([])
  );

  return unsubscribe;
}

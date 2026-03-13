/**
 * functions/src/tasks.ts
 *
 * Cloud Functions para operações de tarefas.
 * Todas as escritas passam pelo servidor — o cliente nunca escreve
 * diretamente no banco de tarefas.
 *
 * Frontend chama via httpsCallable('createTask', { ... })
 */

import * as functions from "firebase-functions";
import { db } from "./lib/admin";
import { requireAuth } from "./lib/auth";
import { assertString, assertBoolean, cleanObject } from "./lib/validate";

type Priority = "low" | "medium" | "high" | "urgent";
type TaskStatus = "pending" | "in_progress" | "done" | "cancelled";

interface TaskData {
  id: string;
  title: string;
  description?: string;
  date?: string;
  weekKey?: string;
  priority: Priority;
  status: TaskStatus;
  categoryId?: string;
  isDaily: boolean;
  isWeekly: boolean;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

// ─── createTask ───────────────────────────────────────────────────────────────

export const createTask = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    const { uid } = requireAuth(context);

    // Validação server-side
    const title = assertString(data.title, "title");
    const isDaily = assertBoolean(data.isDaily, "isDaily");
    const isWeekly = assertBoolean(data.isWeekly, "isWeekly");

    if (!isDaily && !isWeekly) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "A tarefa deve ser diária ou semanal."
      );
    }

    const validPriorities: Priority[] = ["low", "medium", "high", "urgent"];
    const priority: Priority = validPriorities.includes(data.priority)
      ? data.priority
      : "medium";

    const taskRef = db.ref(`tasks/${uid}`).push();
    const taskId = taskRef.key!;
    const now = Date.now();

    // cleanObject garante que nenhum undefined chega ao DB
    const task = cleanObject<TaskData>({
      id: taskId,
      title,
      description: data.description || undefined,
      date: data.date || undefined,
      weekKey: data.weekKey || undefined,
      priority,
      status: "pending",
      categoryId: data.categoryId || undefined,
      isDaily,
      isWeekly,
      createdAt: now,
      updatedAt: now,
    }) as TaskData;

    const updates: Record<string, unknown> = {
      [`tasks/${uid}/${taskId}`]: task,
    };

    if (isDaily && data.date) {
      updates[`dailyTasks/${uid}/${data.date}/${taskId}`] = true;
    }

    if (isWeekly && data.weekKey) {
      updates[`weeklyTasks/${uid}/${data.weekKey}/${taskId}`] = true;
    }

    await db.ref().update(updates);
    return { task };
  });

// ─── updateTask ───────────────────────────────────────────────────────────────

export const updateTask = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    const { uid } = requireAuth(context);

    const taskId = assertString(data.taskId, "taskId");

    // Verifica que a task pertence ao usuário antes de atualizar
    const existing = await db.ref(`tasks/${uid}/${taskId}`).get();
    if (!existing.exists()) {
      throw new functions.https.HttpsError("not-found", "Tarefa não encontrada.");
    }

    const prev = existing.val() as TaskData;
    const now = Date.now();

    const updated = cleanObject<TaskData>({
      ...prev,
      ...(data.title ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description || undefined } : {}),
      ...(data.priority ? { priority: data.priority } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.date !== undefined ? { date: data.date || undefined } : {}),
      ...(data.weekKey !== undefined ? { weekKey: data.weekKey || undefined } : {}),
      updatedAt: now,
    }) as TaskData;

    const updates: Record<string, unknown> = {
      [`tasks/${uid}/${taskId}`]: updated,
    };

    // Reagenda índices se data mudou
    if (data.date !== undefined && data.date !== prev.date) {
      if (prev.date) updates[`dailyTasks/${uid}/${prev.date}/${taskId}`] = null;
      if (data.date) updates[`dailyTasks/${uid}/${data.date}/${taskId}`] = true;
    }

    if (data.weekKey !== undefined && data.weekKey !== prev.weekKey) {
      if (prev.weekKey) updates[`weeklyTasks/${uid}/${prev.weekKey}/${taskId}`] = null;
      if (data.weekKey) updates[`weeklyTasks/${uid}/${data.weekKey}/${taskId}`] = true;
    }

    await db.ref().update(updates);
    return { success: true };
  });

// ─── completeTask ─────────────────────────────────────────────────────────────

export const completeTask = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    const { uid } = requireAuth(context);
    const taskId = assertString(data.taskId, "taskId");

    const existing = await db.ref(`tasks/${uid}/${taskId}`).get();
    if (!existing.exists()) {
      throw new functions.https.HttpsError("not-found", "Tarefa não encontrada.");
    }

    const now = Date.now();
    await db.ref(`tasks/${uid}/${taskId}`).update({
      status: "done",
      completedAt: now,
      updatedAt: now,
    });

    return { success: true };
  });

// ─── uncompleteTask ───────────────────────────────────────────────────────────

export const uncompleteTask = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    const { uid } = requireAuth(context);
    const taskId = assertString(data.taskId, "taskId");

    await db.ref(`tasks/${uid}/${taskId}`).update({
      status: "pending",
      completedAt: null,
      updatedAt: Date.now(),
    });

    return { success: true };
  });

// ─── deleteTask ───────────────────────────────────────────────────────────────

export const deleteTask = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    const { uid } = requireAuth(context);
    const taskId = assertString(data.taskId, "taskId");

    const existing = await db.ref(`tasks/${uid}/${taskId}`).get();
    if (!existing.exists()) {
      throw new functions.https.HttpsError("not-found", "Tarefa não encontrada.");
    }

    const task = existing.val() as TaskData;
    const updates: Record<string, null> = {
      [`tasks/${uid}/${taskId}`]: null,
    };

    if (task.isDaily && task.date) {
      updates[`dailyTasks/${uid}/${task.date}/${taskId}`] = null;
    }

    if (task.isWeekly && task.weekKey) {
      updates[`weeklyTasks/${uid}/${task.weekKey}/${taskId}`] = null;
    }

    await db.ref().update(updates);
    return { success: true };
  });

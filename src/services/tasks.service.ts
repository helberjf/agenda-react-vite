/**
 * services/tasks.service.ts
 * Todas as leituras e escritas passam pela API autenticada.
 *
 * Isso evita depender de regras do RTDB no cliente para montar a lista
 * de tarefas e mantém o frontend alinhado com o mesmo backend usado
 * para criar, editar e excluir tarefas.
 */

import { api } from "@/lib/api";
import type { Task } from "@/types";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validators/task";

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function compareDeadline(a?: string, b?: string) {
  if (a && b) return a.localeCompare(b);
  if (a) return -1;
  if (b) return 1;
  return 0;
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    const deadlineOrder = compareDeadline(a.deadline, b.deadline);
    if (deadlineOrder !== 0) return deadlineOrder;
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });
}

export async function createTask(_uid: string, input: CreateTaskInput): Promise<Task> {
  const { task } = await api.post<{ task: Task }>("/tasks", input);
  return task;
}

export async function updateTask(_uid: string, taskId: string, input: UpdateTaskInput): Promise<void> {
  await api.patch(`/tasks/${taskId}`, input);
}

export async function completeTask(_uid: string, taskId: string): Promise<void> {
  await api.patch(`/tasks/${taskId}`, { action: "complete" });
}

export async function uncompleteTask(_uid: string, taskId: string): Promise<void> {
  await api.patch(`/tasks/${taskId}`, { action: "uncomplete" });
}

export async function deleteTask(_uid: string, taskId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}`);
}

export async function getTasksByDate(uid: string, dateKey: string): Promise<Task[]> {
  void uid;
  const { tasks } = await api.get<{ tasks: Task[] }>("/tasks", { date: dateKey });
  return sortTasks(tasks);
}

export async function getTasksInRange(uid: string, startDate: string, endDate: string): Promise<Task[]> {
  void uid;
  const { tasks } = await api.get<{ tasks: Task[] }>("/tasks", { startDate, endDate });
  return sortTasks(tasks);
}

export async function getWeeklyTasks(uid: string, dateKeys: string[]): Promise<Task[]> {
  const tasksByDay = await Promise.all(dateKeys.map((dateKey) => getTasksByDate(uid, dateKey)));
  return tasksByDay.flat();
}

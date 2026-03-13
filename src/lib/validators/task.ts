/**
 * lib/validators/task.ts
 *
 * Schemas Zod para criação e edição de tarefas.
 * Validação no cliente — Firebase Security Rules são a defesa real no servidor.
 */

import { z } from "zod";

export const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const taskStatusSchema = z.enum(["pending", "in_progress", "done", "cancelled"]);

const baseTaskSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(200),
  description: z.string().trim().max(2000).optional(),
  date: z.string().optional(),
  weekKey: z.string().optional(),
  priority: prioritySchema.default("medium"),
  categoryId: z.string().optional(),
  isDaily: z.boolean().default(false),
  isWeekly: z.boolean().default(false),
});

export const createTaskSchema = baseTaskSchema.refine(
  (data) => data.isDaily || data.isWeekly,
  { message: "A tarefa deve ser diária ou semanal", path: ["isDaily"] }
);

export const updateTaskSchema = baseTaskSchema
  .partial()
  .extend({
    status: taskStatusSchema.optional(),
    completedAt: z.number().optional(),
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

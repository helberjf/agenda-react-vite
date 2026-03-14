import { z } from "zod";

export const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const taskStatusSchema = z.enum(["pending", "in_progress", "done", "cancelled"]);

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida");
const optionalDateKeySchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  dateKeySchema.optional()
);

const baseTaskSchema = z.object({
  title: z.string().trim().min(1, "Titulo obrigatorio").max(200),
  description: z.string().trim().max(2000).optional(),
  date: dateKeySchema,
  deadline: optionalDateKeySchema,
  priority: prioritySchema.default("medium"),
  categoryId: z.string().optional(),
});

export const createTaskSchema = baseTaskSchema.refine(
  (data) => !data.deadline || data.deadline >= data.date,
  {
    path: ["deadline"],
    message: "Prazo deve ser igual ou posterior a data",
  }
);

export const updateTaskSchema = baseTaskSchema.partial().extend({
  status: taskStatusSchema.optional(),
  completedAt: z.number().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

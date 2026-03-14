import { z } from "zod";

const baseEventSchema = z.object({
  title: z.string().trim().min(1, "Titulo obrigatorio").max(200),
  description: z.string().trim().max(2000).optional(),
  startAt: z.number({ required_error: "Data de inicio obrigatoria" }),
  endAt: z.number({ required_error: "Data de fim obrigatoria" }),
  allDay: z.boolean().default(false),
  location: z.string().trim().max(300).optional(),
  categoryId: z.string().optional(),
});

export const createEventSchema = baseEventSchema.refine(
  (data) => data.endAt > data.startAt,
  { message: "O horario de fim deve ser posterior ao inicio", path: ["endAt"] }
);

export const updateEventSchema = baseEventSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

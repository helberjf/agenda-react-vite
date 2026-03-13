import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(80),
    email: z.string().trim().toLowerCase().email("Email inválido"),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Deve conter letra maiúscula")
      .regex(/[0-9]/, "Deve conter número"),
    confirm: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Senhas não coincidem",
    path: ["confirm"],
  });

export const dailyLogSchema = z.object({
  content: z.string().trim().min(1, "Escreva ao menos um registro").max(10000),
  mood: z.enum(["great", "good", "neutral", "bad", "terrible"]).optional(),
});

export const weeklyGoalSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(200),
  description: z.string().trim().max(2000).optional(),
  target: z.number().int().min(1).max(1000).default(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type DailyLogInput = z.infer<typeof dailyLogSchema>;
export type WeeklyGoalInput = z.infer<typeof weeklyGoalSchema>;

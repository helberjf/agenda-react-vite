/**
 * api/_lib/validate.ts
 * Validação server-side leve. Zod não é usado aqui para manter bundle pequeno.
 * A validação principal já ocorre no frontend com Zod.
 */

export function requireString(value: unknown, field: string, max = 500): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw { status: 400, message: `Campo '${field}' obrigatório.` };
  }
  if (value.trim().length > max) {
    throw { status: 400, message: `Campo '${field}' muito longo (máx ${max}).` };
  }
  return value.trim();
}

export function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || isNaN(value)) {
    throw { status: 400, message: `Campo '${field}' deve ser numérico.` };
  }
  return value;
}

export function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw { status: 400, message: `Campo '${field}' deve ser booleano.` };
  }
  return value;
}

const PRIORITY_VALUES = ["low", "medium", "high", "urgent"] as const;
type Priority = (typeof PRIORITY_VALUES)[number];

export function parsePriority(value: unknown): Priority {
  if (typeof value === "string" && PRIORITY_VALUES.includes(value as Priority)) {
    return value as Priority;
  }
  return "medium";
}

/** Remove undefined e null antes de salvar no Firebase */
export function clean<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ) as T;
}

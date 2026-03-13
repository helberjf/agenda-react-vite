/**
 * functions/src/lib/validate.ts
 *
 * Validação de inputs nas Cloud Functions.
 * O Zod não é usado aqui para manter o bundle leve — validação manual.
 * A validação principal já acontece no frontend com Zod antes do envio.
 */

import * as functions from "firebase-functions";

export function assertString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Campo '${field}' inválido.`
    );
  }
  return value.trim();
}

export function assertNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || isNaN(value)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Campo '${field}' deve ser um número.`
    );
  }
  return value;
}

export function assertBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Campo '${field}' deve ser verdadeiro ou falso.`
    );
  }
  return value;
}

/** Remove campos undefined/null antes de salvar no DB */
export function cleanObject<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  ) as Partial<T>;
}

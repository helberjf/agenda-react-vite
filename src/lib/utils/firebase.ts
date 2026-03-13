/**
 * lib/utils/firebase.ts
 *
 * Firebase Realtime Database não aceita `undefined` em nenhum campo.
 * Campos opcionais ausentes devem ser omitidos do objeto — nunca undefined.
 *
 * stripUndefined remove recursivamente todas as chaves com valor undefined
 * antes de qualquer escrita no banco.
 */
export function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

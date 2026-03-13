/**
 * functions/src/lib/auth.ts
 *
 * Verificação de autenticação para callable functions.
 * Toda função que modifica dados DEVE chamar requireAuth() primeiro.
 *
 * Por que isso é mais seguro que o frontend direto no DB:
 * - O token é verificado pelo servidor, não pelo cliente
 * - Rate limiting pode ser adicionado aqui
 * - Lógica de negócio não fica exposta no bundle JS do frontend
 * - Auditoria centralizada de quem fez o quê
 */

import * as functions from "firebase-functions";

export interface AuthContext {
  uid: string;
  email: string | undefined;
}

/**
 * Lança HttpsError se o usuário não está autenticado.
 * Use no início de toda callable function.
 */
export function requireAuth(
  context: functions.https.CallableContext
): AuthContext {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Autenticação necessária."
    );
  }
  return {
    uid: context.auth.uid,
    email: context.auth.token.email,
  };
}

/**
 * Garante que o uid do token é o mesmo do recurso sendo acessado.
 * Evita que um usuário modifique dados de outro mesmo estando autenticado.
 */
export function requireOwnership(tokenUid: string, resourceUid: string): void {
  if (tokenUid !== resourceUid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Acesso negado."
    );
  }
}

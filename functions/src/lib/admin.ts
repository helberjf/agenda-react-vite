/**
 * functions/src/lib/admin.ts
 *
 * Inicialização única do Firebase Admin SDK.
 * Admin SDK tem acesso total ao banco — não precisa de Security Rules.
 * A segurança fica na verificação do token do usuário em cada função.
 */

import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.database();
export const auth = admin.auth();
export { admin };

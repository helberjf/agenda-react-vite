/**
 * api/_lib/auth.ts
 *
 * Verifica o token Firebase do header Authorization: Bearer <token>.
 * O token é emitido pelo Firebase Auth no frontend (getIdToken()).
 * O Admin SDK valida a assinatura — não é possível forjar.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminAuth } from "./admin.js";
import type * as admin from "firebase-admin";

export interface AuthUser {
  uid: string;
  email: string | undefined;
}

/**
 * Extrai e verifica o token do header.
 * Lança erro 401 se inválido ou ausente.
 */
export async function verifyToken(req: VercelRequest): Promise<AuthUser> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw { status: 401, message: "Token não fornecido." };
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded: admin.auth.DecodedIdToken = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    throw { status: 401, message: "Token inválido ou expirado." };
  }
}

/**
 * Wrapper para handlers autenticados.
 * Injeta o usuário verificado e lida com erros de forma centralizada.
 *
 * Uso:
 *   export default withAuth(async (req, res, user) => { ... });
 */
export function withAuth(
  handler: (req: VercelRequest, res: VercelResponse, user: AuthUser) => Promise<unknown> | unknown
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    // CORS — permite chamadas do frontend na Vercel e localhost
    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    try {
      const user = await verifyToken(req);
      await handler(req, res, user);
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      const status = error.status ?? 500;
      const message = error.message ?? "Erro interno do servidor.";
      res.status(status).json({ error: message });
    }
  };
}

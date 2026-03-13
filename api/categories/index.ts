/**
 * api/categories/index.ts
 * GET  /api/categories → listar categorias do usuário
 * POST /api/categories → criar categoria
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_lib/admin";
import { withAuth } from "../_lib/auth";
import { requireString } from "../_lib/validate";

const VALID_TYPES = ["task", "event", "both"] as const;

export default withAuth(async (req: VercelRequest, res: VercelResponse, user) => {
  const { uid } = user;

  if (req.method === "GET") {
    const snap = await db.ref(`categories/${uid}`).get();
    const categories = snap.exists()
      ? Object.values(snap.val() as Record<string, unknown>)
      : [];
    return res.status(200).json({ categories });
  }

  if (req.method === "POST") {
    const body = req.body as Record<string, unknown>;
    const name = requireString(body.name, "name", 50);

    // Valida formato hex de cor
    const color =
      typeof body.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(body.color)
        ? body.color
        : "#6B7280";

    const type = VALID_TYPES.includes(body.type as (typeof VALID_TYPES)[number])
      ? (body.type as string)
      : "both";

    const catRef = db.ref(`categories/${uid}`).push();
    const catId = catRef.key!;

    const category = { id: catId, name, color, type };

    await db.ref(`categories/${uid}/${catId}`).set(category);
    return res.status(201).json({ category });
  }

  res.status(405).json({ error: "Método não permitido." });
});

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_lib/admin.js";
import { withAuth } from "../_lib/auth.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse, user) => {
  const { uid } = user;
  const categoryId = req.query.categoryId as string;

  const snap = await db.ref(`categories/${uid}/${categoryId}`).get();
  if (!snap.exists()) return res.status(404).json({ error: "Categoria não encontrada." });

  if (req.method === "PATCH") {
    const body = req.body as Record<string, unknown>;
    const prev = snap.val() as Record<string, unknown>;

    const updated = {
      ...prev,
      ...(body.name ? { name: String(body.name).trim() } : {}),
      ...(typeof body.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(body.color)
        ? { color: body.color }
        : {}),
      ...(body.type ? { type: body.type } : {}),
    };

    await db.ref(`categories/${uid}/${categoryId}`).set(updated);
    return res.status(200).json({ category: updated });
  }

  if (req.method === "DELETE") {
    await db.ref(`categories/${uid}/${categoryId}`).remove();
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: "Método não permitido." });
});

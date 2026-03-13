/**
 * api/logs/[date].ts
 * GET /api/logs/:date → buscar log do dia
 * PUT /api/logs/:date → criar ou atualizar log do dia
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_lib/admin.js";
import { withAuth } from "../_lib/auth.js";
import { requireString, clean } from "../_lib/validate.js";

const VALID_MOODS = ["great", "good", "neutral", "bad", "terrible"];

export default withAuth(async (req: VercelRequest, res: VercelResponse, user) => {
  const { uid } = user;
  const date = req.query.date as string;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Formato de data inválido. Use yyyy-MM-dd." });
  }

  if (req.method === "GET") {
    const snap = await db.ref(`dailyLogs/${uid}/${date}`).get();
    return res.status(200).json({ log: snap.exists() ? snap.val() : null });
  }

  if (req.method === "PUT") {
    const body = req.body as Record<string, unknown>;
    const content = requireString(body.content, "content", 10000);

    const existing = await db.ref(`dailyLogs/${uid}/${date}`).get();
    const now = Date.now();

    const mood =
      typeof body.mood === "string" && VALID_MOODS.includes(body.mood)
        ? body.mood
        : undefined;

    const log = clean({
      date,
      content,
      ...(mood ? { mood } : {}),
      createdAt: existing.exists() ? existing.val().createdAt : now,
      updatedAt: now,
    });

    await db.ref(`dailyLogs/${uid}/${date}`).set(log);
    return res.status(200).json({ log });
  }

  res.status(405).json({ error: "Método não permitido." });
});

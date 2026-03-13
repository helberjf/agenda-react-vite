import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_lib/admin";
import { withAuth } from "../_lib/auth";
import { clean } from "../_lib/validate";

export default withAuth(async (req: VercelRequest, res: VercelResponse, user) => {
  const { uid } = user;
  const eventId = req.query.eventId as string;

  const snap = await db.ref(`events/${uid}/${eventId}`).get();
  if (!snap.exists()) return res.status(404).json({ error: "Evento não encontrado." });

  if (req.method === "PATCH") {
    const body = req.body as Record<string, unknown>;
    const prev = snap.val() as Record<string, unknown>;

    const updated = clean({
      ...prev,
      ...(body.title ? { title: String(body.title) } : {}),
      ...(body.description !== undefined ? { description: body.description || null } : {}),
      ...(body.startAt ? { startAt: Number(body.startAt) } : {}),
      ...(body.endAt ? { endAt: Number(body.endAt) } : {}),
      ...(body.location !== undefined ? { location: body.location || null } : {}),
      ...(body.categoryId !== undefined ? { categoryId: body.categoryId || null } : {}),
      updatedAt: Date.now(),
    });

    await db.ref(`events/${uid}/${eventId}`).set(updated);
    return res.status(200).json({ success: true });
  }

  if (req.method === "DELETE") {
    await db.ref(`events/${uid}/${eventId}`).remove();
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: "Método não permitido." });
});

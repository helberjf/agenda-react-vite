/**
 * api/events/index.ts
 * GET  /api/events?start=<ts>&end=<ts> → eventos no período
 * POST /api/events                      → criar evento
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_lib/admin.js";
import { withAuth } from "../_lib/auth.js";
import { requireString, requireNumber, clean } from "../_lib/validate.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse, user) => {
  const { uid } = user;

  if (req.method === "GET") {
    const snap = await db.ref(`events/${uid}`).get();
    if (!snap.exists()) return res.status(200).json({ events: [] });

    let events = Object.values(snap.val() as Record<string, unknown>);

    const { start, end } = req.query as Record<string, string>;
    if (start && end) {
      const startTs = Number(start);
      const endTs = Number(end);
      events = events.filter((e: unknown) => {
        const ev = e as { startAt: number };
        return ev.startAt >= startTs && ev.startAt <= endTs;
      });
    }

    return res.status(200).json({ events });
  }

  if (req.method === "POST") {
    const body = req.body as Record<string, unknown>;
    const title = requireString(body.title, "title", 200);
    const startAt = requireNumber(body.startAt, "startAt");
    const endAt = requireNumber(body.endAt, "endAt");

    if (endAt < startAt) {
      return res.status(400).json({ error: "endAt deve ser ≥ startAt." });
    }

    const eventRef = db.ref(`events/${uid}`).push();
    const eventId = eventRef.key!;
    const now = Date.now();

    const event = clean({
      id: eventId,
      title,
      ...(body.description ? { description: String(body.description) } : {}),
      startAt,
      endAt,
      allDay: body.allDay === true,
      ...(body.location ? { location: String(body.location) } : {}),
      ...(body.categoryId ? { categoryId: String(body.categoryId) } : {}),
      source: "manual",
      createdAt: now,
      updatedAt: now,
    });

    await db.ref(`events/${uid}/${eventId}`).set(event);
    return res.status(201).json({ event });
  }

  res.status(405).json({ error: "Método não permitido." });
});

/**
 * api/tasks/index.ts
 * GET  /api/tasks?date=yyyy-MM-dd  → tarefas do dia
 * GET  /api/tasks?weekKey=yyyy-Www → tarefas da semana
 * POST /api/tasks                  → criar tarefa
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_lib/admin.js";
import { withAuth } from "../_lib/auth.js";
import { requireString, requireBoolean, parsePriority, clean } from "../_lib/validate.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse, user) => {
  const { uid } = user;

  // ─── GET ─────────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const { date, weekKey } = req.query as Record<string, string>;

    if (!date && !weekKey) {
      return res.status(400).json({ error: "Forneça date ou weekKey." });
    }

    if (date) {
      const indexSnap = await db.ref(`dailyTasks/${uid}/${date}`).get();
      if (!indexSnap.exists()) return res.status(200).json({ tasks: [] });

      const ids = Object.keys(indexSnap.val() as Record<string, boolean>);
      const taskSnaps = await Promise.all(
        ids.map((id) => db.ref(`tasks/${uid}/${id}`).get())
      );
      const tasks = taskSnaps
        .filter((s) => s.exists())
        .map((s) => s.val());

      return res.status(200).json({ tasks });
    }

    if (weekKey) {
      const indexSnap = await db.ref(`weeklyTasks/${uid}/${weekKey}`).get();
      if (!indexSnap.exists()) return res.status(200).json({ tasks: [] });

      const ids = Object.keys(indexSnap.val() as Record<string, boolean>);
      const taskSnaps = await Promise.all(
        ids.map((id) => db.ref(`tasks/${uid}/${id}`).get())
      );
      const tasks = taskSnaps.filter((s) => s.exists()).map((s) => s.val());

      return res.status(200).json({ tasks });
    }
  }

  // ─── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    const body = req.body as Record<string, unknown>;

    const title = requireString(body.title, "title", 200);
    const isDaily = requireBoolean(body.isDaily, "isDaily");
    const isWeekly = requireBoolean(body.isWeekly, "isWeekly");

    if (!isDaily && !isWeekly) {
      return res.status(400).json({ error: "A tarefa deve ser diária ou semanal." });
    }

    const priority = parsePriority(body.priority);
    const taskRef = db.ref(`tasks/${uid}`).push();
    const taskId = taskRef.key!;
    const now = Date.now();

    const task = clean({
      id: taskId,
      title,
      ...(body.description ? { description: String(body.description).trim() } : {}),
      ...(body.date ? { date: String(body.date) } : {}),
      ...(body.weekKey ? { weekKey: String(body.weekKey) } : {}),
      priority,
      status: "pending",
      ...(body.categoryId ? { categoryId: String(body.categoryId) } : {}),
      isDaily,
      isWeekly,
      createdAt: now,
      updatedAt: now,
    });

    const updates: Record<string, unknown> = {
      [`tasks/${uid}/${taskId}`]: task,
    };

    if (isDaily && body.date) {
      updates[`dailyTasks/${uid}/${body.date}/${taskId}`] = true;
    }
    if (isWeekly && body.weekKey) {
      updates[`weeklyTasks/${uid}/${body.weekKey}/${taskId}`] = true;
    }

    await db.ref().update(updates);
    return res.status(201).json({ task });
  }

  res.status(405).json({ error: "Método não permitido." });
});

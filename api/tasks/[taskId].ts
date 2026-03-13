/**
 * api/tasks/[taskId].ts
 * PATCH  /api/tasks/:taskId          → atualizar campos
 * DELETE /api/tasks/:taskId          → excluir
 * POST   /api/tasks/:taskId/complete → concluir (via body action)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_lib/admin.js";
import { withAuth } from "../_lib/auth.js";
import { clean, parsePriority } from "../_lib/validate.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse, user) => {
  const { uid } = user;
  const taskId = req.query.taskId as string;

  if (!taskId) return res.status(400).json({ error: "taskId obrigatório." });

  // Verifica que a task existe e pertence ao usuário
  const snap = await db.ref(`tasks/${uid}/${taskId}`).get();
  if (!snap.exists()) return res.status(404).json({ error: "Tarefa não encontrada." });

  const prev = snap.val() as Record<string, unknown>;

  // ─── PATCH ───────────────────────────────────────────────────────────────────
  if (req.method === "PATCH") {
    const body = req.body as Record<string, unknown>;
    const now = Date.now();

    // action especial: complete / uncomplete
    if (body.action === "complete") {
      await db.ref(`tasks/${uid}/${taskId}`).update({
        status: "done",
        completedAt: now,
        updatedAt: now,
      });
      return res.status(200).json({ success: true });
    }

    if (body.action === "uncomplete") {
      await db.ref(`tasks/${uid}/${taskId}`).update({
        status: "pending",
        completedAt: null,
        updatedAt: now,
      });
      return res.status(200).json({ success: true });
    }

    // Atualização parcial de campos
    const updated = clean({
      ...prev,
      ...(body.title ? { title: String(body.title).trim() } : {}),
      ...(body.description !== undefined ? { description: body.description ? String(body.description) : null } : {}),
      ...(body.priority ? { priority: parsePriority(body.priority) } : {}),
      ...(body.status ? { status: String(body.status) } : {}),
      ...(body.categoryId !== undefined ? { categoryId: body.categoryId ? String(body.categoryId) : null } : {}),
      updatedAt: now,
    });

    const updates: Record<string, unknown> = {
      [`tasks/${uid}/${taskId}`]: updated,
    };

    // Reagenda índices se data mudou
    if (body.date !== undefined && body.date !== prev.date) {
      if (prev.date) updates[`dailyTasks/${uid}/${prev.date}/${taskId}`] = null;
      if (body.date) updates[`dailyTasks/${uid}/${body.date}/${taskId}`] = true;
    }

    if (body.weekKey !== undefined && body.weekKey !== prev.weekKey) {
      if (prev.weekKey) updates[`weeklyTasks/${uid}/${prev.weekKey}/${taskId}`] = null;
      if (body.weekKey) updates[`weeklyTasks/${uid}/${body.weekKey}/${taskId}`] = true;
    }

    await db.ref().update(updates);
    return res.status(200).json({ success: true });
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const updates: Record<string, null> = {
      [`tasks/${uid}/${taskId}`]: null,
    };

    if (prev.isDaily && prev.date) {
      updates[`dailyTasks/${uid}/${prev.date}/${taskId}`] = null;
    }
    if (prev.isWeekly && prev.weekKey) {
      updates[`weeklyTasks/${uid}/${prev.weekKey}/${taskId}`] = null;
    }

    await db.ref().update(updates);
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: "Método não permitido." });
});

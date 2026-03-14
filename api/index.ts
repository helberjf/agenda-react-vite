/**
 * api/index.ts - handler unico Vercel
 * Modelo de tarefas unificado: tasksByDate/{uid}/{date}/{taskId}
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as admin from "firebase-admin";

type RawServiceAccount = {
  project_id?: string;
  projectId?: string;
  client_email?: string;
  clientEmail?: string;
  private_key?: string;
  privateKey?: string;
};

function toAppError(message: string): AppError {
  return { status: 500, message };
}

function unwrapQuotedString(value: string) {
  const trimmed = value.trim();
  return (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith("\"") && trimmed.endsWith("\""))
    ? trimmed.slice(1, -1)
    : trimmed;
}

function normalizeServiceAccount(value: unknown) {
  if (!value || typeof value !== "object") {
    throw toAppError("FIREBASE_SERVICE_ACCOUNT deve ser um objeto JSON valido.");
  }

  const raw = value as RawServiceAccount;
  const projectId = raw.projectId ?? raw.project_id;
  const clientEmail = raw.clientEmail ?? raw.client_email;
  const privateKey = (raw.privateKey ?? raw.private_key)?.replace(/\\n/g, "\n");

  if (!projectId) {
    throw toAppError("FIREBASE_SERVICE_ACCOUNT sem project_id.");
  }

  if (!clientEmail) {
    throw toAppError("FIREBASE_SERVICE_ACCOUNT sem client_email.");
  }

  if (!privateKey) {
    throw toAppError("FIREBASE_SERVICE_ACCOUNT sem private_key.");
  }

  return { projectId, clientEmail, privateKey };
}

function parseServiceAccount(raw: string) {
  let current: unknown = raw;

  for (let index = 0; index < 3; index += 1) {
    if (typeof current !== "string") {
      return normalizeServiceAccount(current);
    }

    const candidate = unwrapQuotedString(current);

    try {
      current = JSON.parse(candidate);
    } catch {
      if (candidate.startsWith("{") && candidate.endsWith("}")) {
        throw toAppError("FIREBASE_SERVICE_ACCOUNT nao e um JSON valido.");
      }

      current = candidate;
      break;
    }
  }

  return normalizeServiceAccount(current);
}

function ensureAdminInitialized() {
  if (!admin.apps.length) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    const dbUrl = process.env.FIREBASE_DATABASE_URL;

    if (!sa || !dbUrl) {
      throw { status: 500, message: "Configuracao do Firebase ausente no servidor." } as AppError;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(parseServiceAccount(sa)),
        databaseURL: dbUrl,
      });
    } catch (error) {
      const appError = error as AppError;
      if (appError?.message) {
        throw appError;
      }

      throw { status: 500, message: "FIREBASE_SERVICE_ACCOUNT invalida no servidor." } as AppError;
    }
  }
}

const db = () => {
  ensureAdminInitialized();
  return admin.database();
};
const authAdmin = () => {
  ensureAdminInitialized();
  return admin.auth();
};

type AppError = { status: number; message: string };
type User = { uid: string };
type Handler = (
  req: VercelRequest,
  res: VercelResponse,
  user: User,
  params: Record<string, string>
) => Promise<void>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: Handler;
}

const routes: Route[] = [];

async function verifyToken(req: VercelRequest): Promise<User> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw { status: 401, message: "Token nao fornecido." } as AppError;
  }

  const decoded = await authAdmin().verifyIdToken(header.split("Bearer ")[1]).catch(() => {
    throw { status: 401, message: "Token invalido." } as AppError;
  });

  return { uid: decoded.uid };
}

function route(method: string, path: string, handler: Handler) {
  const paramNames: string[] = [];
  const pattern = new RegExp(
    "^" +
      path.replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name);
        return "([^/]+)";
      }) +
      "$"
  );

  routes.push({ method, pattern, paramNames, handler });
}

function clean<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ) as T;
}

function str(value: unknown, field: string, max = 500): string {
  if (typeof value !== "string" || !value.trim()) {
    throw { status: 400, message: `'${field}' obrigatorio.` } as AppError;
  }
  if (value.trim().length > max) {
    throw { status: 400, message: `'${field}' muito longo.` } as AppError;
  }
  return value.trim();
}

function num(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw { status: 400, message: `'${field}' deve ser numero.` } as AppError;
  }
  return value;
}

function priority(value: unknown): string {
  return ["low", "medium", "high", "urgent"].includes(value as string) ? (value as string) : "medium";
}

function optionalDateKey(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = str(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
    throw { status: 400, message: `${field} invalido.` } as AppError;
  }

  return parsed;
}

function buildDateRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T12:00:00`);
  const last = new Date(`${endDate}T12:00:00`);

  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

async function loadTasksByDate(uid: string, dateKey: string) {
  const snap = await db().ref(`tasksByDate/${uid}/${dateKey}`).get();
  if (!snap.exists()) return [];

  const ids = Object.keys(snap.val() as Record<string, boolean>);
  const taskSnaps = await Promise.all(ids.map((id) => db().ref(`tasks/${uid}/${id}`).get()));
  return taskSnaps.filter((taskSnap) => taskSnap.exists()).map((taskSnap) => taskSnap.val());
}

function ensureEventRange(startAt: number, endAt: number) {
  if (endAt <= startAt) {
    throw { status: 400, message: "O horario de fim deve ser posterior ao inicio." } as AppError;
  }
}

async function hasEventConflict(uid: string, startAt: number, endAt: number, excludeEventId?: string) {
  const snap = await db().ref(`events/${uid}`).get();
  if (!snap.exists()) return false;

  return Object.values(snap.val() as Record<string, { id?: string; startAt?: number; endAt?: number }>).some(
    (event) => {
      if (excludeEventId && event.id === excludeEventId) {
        return false;
      }

      if (typeof event.startAt !== "number" || typeof event.endAt !== "number") {
        return false;
      }

      return event.startAt < endAt && event.endAt > startAt;
    }
  );
}

route("GET", "/api/tasks", async (req, res, { uid }) => {
  const { date, startDate, endDate } = req.query as Record<string, string>;

  if (date) {
    return void res.json({ tasks: await loadTasksByDate(uid, date) });
  }

  if (startDate && endDate) {
    const dates = buildDateRange(startDate, endDate);
    const tasks = (await Promise.all(dates.map((dateKey) => loadTasksByDate(uid, dateKey)))).flat();
    return void res.json({ tasks });
  }

  return void res.status(400).json({
    error: "Forneca ?date=yyyy-MM-dd ou ?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd",
  });
});

route("POST", "/api/tasks", async (req, res, { uid }) => {
  const body = req.body as Record<string, unknown>;
  const title = str(body.title, "title", 200);
  const date = optionalDateKey(body.date, "date");
  const deadline = optionalDateKey(body.deadline, "deadline");

  if (!date) {
    return void res.status(400).json({ error: "Data invalida." });
  }

  if (deadline && deadline < date) {
    return void res.status(400).json({ error: "Prazo deve ser igual ou posterior a data." });
  }

  const taskRef = db().ref(`tasks/${uid}`).push();
  const taskId = taskRef.key!;
  const now = Date.now();

  const task = clean({
    id: taskId,
    title,
    description: (body.description as string) || undefined,
    date,
    deadline,
    priority: priority(body.priority),
    status: "pending",
    categoryId: (body.categoryId as string) || undefined,
    createdAt: now,
    updatedAt: now,
  });

  await db().ref().update({
    [`tasks/${uid}/${taskId}`]: task,
    [`tasksByDate/${uid}/${date}/${taskId}`]: true,
  });

  res.status(201).json({ task });
});

route("PATCH", "/api/tasks/:taskId", async (req, res, { uid }, { taskId }) => {
  const snap = await db().ref(`tasks/${uid}/${taskId}`).get();
  if (!snap.exists()) {
    return void res.status(404).json({ error: "Tarefa nao encontrada." });
  }

  const prev = snap.val() as Record<string, unknown>;
  const body = req.body as Record<string, unknown>;
  const now = Date.now();
  const nextDate = body.date !== undefined ? optionalDateKey(body.date, "date") : undefined;
  const nextDeadline = body.deadline !== undefined ? optionalDateKey(body.deadline, "deadline") : undefined;

  if (body.date !== undefined && !nextDate) {
    return void res.status(400).json({ error: "Data invalida." });
  }

  const effectiveDate = nextDate ?? (prev.date as string);
  const effectiveDeadline = body.deadline !== undefined ? nextDeadline : (prev.deadline as string | undefined);

  if (effectiveDeadline && effectiveDeadline < effectiveDate) {
    return void res.status(400).json({ error: "Prazo deve ser igual ou posterior a data." });
  }

  if (body.action === "complete") {
    await db().ref(`tasks/${uid}/${taskId}`).update({ status: "done", completedAt: now, updatedAt: now });
    return void res.json({ success: true });
  }

  if (body.action === "uncomplete") {
    await db().ref(`tasks/${uid}/${taskId}`).update({ status: "pending", completedAt: null, updatedAt: now });
    return void res.json({ success: true });
  }

  const updated = clean({
    ...prev,
    ...(body.title ? { title: (body.title as string).trim() } : {}),
    ...(body.description !== undefined ? { description: body.description || undefined } : {}),
    ...(body.priority ? { priority: priority(body.priority) } : {}),
    ...(body.status ? { status: body.status } : {}),
    ...(body.categoryId !== undefined ? { categoryId: body.categoryId || undefined } : {}),
    ...(nextDate ? { date: nextDate } : {}),
    ...(body.deadline !== undefined ? { deadline: nextDeadline } : {}),
    updatedAt: now,
  });

  const updates: Record<string, unknown> = {
    [`tasks/${uid}/${taskId}`]: updated,
  };

  if (nextDate && nextDate !== prev.date) {
    updates[`tasksByDate/${uid}/${prev.date as string}/${taskId}`] = null;
    updates[`tasksByDate/${uid}/${nextDate}/${taskId}`] = true;
  }

  await db().ref().update(updates);
  res.json({ success: true });
});

route("DELETE", "/api/tasks/:taskId", async (_req, res, { uid }, { taskId }) => {
  const snap = await db().ref(`tasks/${uid}/${taskId}`).get();
  if (!snap.exists()) {
    return void res.status(404).json({ error: "Tarefa nao encontrada." });
  }

  const task = snap.val() as { date: string };
  await db().ref().update({
    [`tasks/${uid}/${taskId}`]: null,
    [`tasksByDate/${uid}/${task.date}/${taskId}`]: null,
  });

  res.json({ success: true });
});

route("GET", "/api/events", async (req, res, { uid }) => {
  const snap = await db().ref(`events/${uid}`).get();
  if (!snap.exists()) {
    return void res.json({ events: [] });
  }

  let events = Object.values(snap.val() as Record<string, unknown>);
  const { start, end } = req.query as Record<string, string>;
  if (start && end) {
    events = events.filter(
      (event) =>
        (event as { startAt: number }).startAt >= Number(start) &&
        (event as { startAt: number }).startAt <= Number(end)
    );
  }

  res.json({ events });
});

route("POST", "/api/events", async (req, res, { uid }) => {
  const body = req.body as Record<string, unknown>;
  const title = str(body.title, "title", 200);
  const startAt = num(body.startAt, "startAt");
  const endAt = num(body.endAt, "endAt");
  ensureEventRange(startAt, endAt);

  if (await hasEventConflict(uid, startAt, endAt)) {
    return void res.status(409).json({ error: "Ja existe um agendamento nesse horario." });
  }

  const eventRef = db().ref(`events/${uid}`).push();
  const eventId = eventRef.key!;
  const now = Date.now();

  const event = clean({
    id: eventId,
    title,
    description: (body.description as string) || undefined,
    startAt,
    endAt,
    allDay: body.allDay === true,
    location: (body.location as string) || undefined,
    categoryId: (body.categoryId as string) || undefined,
    source: "manual",
    createdAt: now,
    updatedAt: now,
  });

  await db().ref(`events/${uid}/${eventId}`).set(event);
  res.status(201).json({ event });
});

route("PATCH", "/api/events/:eventId", async (req, res, { uid }, { eventId }) => {
  const snap = await db().ref(`events/${uid}/${eventId}`).get();
  if (!snap.exists()) {
    return void res.status(404).json({ error: "Evento nao encontrado." });
  }

  const previous = snap.val() as Record<string, unknown>;
  const nextStartAt = req.body.startAt !== undefined ? num(req.body.startAt, "startAt") : (previous.startAt as number);
  const nextEndAt = req.body.endAt !== undefined ? num(req.body.endAt, "endAt") : (previous.endAt as number);
  ensureEventRange(nextStartAt, nextEndAt);

  if (await hasEventConflict(uid, nextStartAt, nextEndAt, eventId)) {
    return void res.status(409).json({ error: "Ja existe um agendamento nesse horario." });
  }

  const updated = clean({ ...previous, ...req.body, startAt: nextStartAt, endAt: nextEndAt, updatedAt: Date.now() });
  await db().ref(`events/${uid}/${eventId}`).set(updated);
  res.json({ success: true });
});

route("DELETE", "/api/events/:eventId", async (_req, res, { uid }, { eventId }) => {
  await db().ref(`events/${uid}/${eventId}`).remove();
  res.json({ success: true });
});

route("GET", "/api/logs", async (req, res, { uid }) => {
  const { month } = req.query as Record<string, string>;
  const snap = await db().ref(`dailyLogs/${uid}`).get();
  if (!snap.exists()) {
    return void res.json({ logs: [] });
  }

  let logs = Object.values(snap.val() as Record<string, unknown>);
  if (month) {
    logs = logs.filter((log) => (log as { date?: string }).date?.startsWith(month));
  }

  logs.sort((a, b) => (b as { date: string }).date.localeCompare((a as { date: string }).date));
  res.json({ logs });
});

route("GET", "/api/logs/:date", async (_req, res, { uid }, { date }) => {
  const snap = await db().ref(`dailyLogs/${uid}/${date}`).get();
  res.json({ log: snap.exists() ? snap.val() : null });
});

route("PUT", "/api/logs/:date", async (req, res, { uid }, { date }) => {
  const content = str(req.body.content, "content", 10000);
  const existing = await db().ref(`dailyLogs/${uid}/${date}`).get();
  const now = Date.now();
  const moods = ["great", "good", "neutral", "bad", "terrible"];
  const mood = moods.includes(req.body.mood) ? req.body.mood : undefined;

  const log = clean({
    date,
    content,
    mood: mood || undefined,
    createdAt: existing.exists() ? existing.val().createdAt : now,
    updatedAt: now,
  });

  await db().ref(`dailyLogs/${uid}/${date}`).set(log);
  res.json({ log });
});

route("GET", "/api/categories", async (_req, res, { uid }) => {
  const snap = await db().ref(`categories/${uid}`).get();
  res.json({ categories: snap.exists() ? Object.values(snap.val() as Record<string, unknown>) : [] });
});

route("POST", "/api/categories", async (req, res, { uid }) => {
  const name = str(req.body.name, "name", 50);
  const color = /^#[0-9A-Fa-f]{6}$/.test(req.body.color) ? req.body.color : "#6B7280";
  const type = ["task", "event", "both"].includes(req.body.type) ? req.body.type : "both";
  const categoryRef = db().ref(`categories/${uid}`).push();
  const category = { id: categoryRef.key, name, color, type };
  await db().ref(`categories/${uid}/${categoryRef.key}`).set(category);
  res.status(201).json({ category });
});

route("PATCH", "/api/categories/:categoryId", async (req, res, { uid }, { categoryId }) => {
  const snap = await db().ref(`categories/${uid}/${categoryId}`).get();
  if (!snap.exists()) {
    return void res.status(404).json({ error: "Categoria nao encontrada." });
  }

  const updated = {
    ...(snap.val() as Record<string, unknown>),
    ...(req.body.name ? { name: req.body.name.trim() } : {}),
    ...(/^#[0-9A-Fa-f]{6}$/.test(req.body.color) ? { color: req.body.color } : {}),
    ...(req.body.type ? { type: req.body.type } : {}),
  };

  await db().ref(`categories/${uid}/${categoryId}`).set(updated);
  res.json({ category: updated });
});

route("DELETE", "/api/categories/:categoryId", async (_req, res, { uid }, { categoryId }) => {
  await db().ref(`categories/${uid}/${categoryId}`).remove();
  res.json({ success: true });
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL ?? "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return void res.status(204).end();
  }

  const path = req.url?.split("?")[0] ?? "";
  const method = req.method?.toUpperCase() ?? "GET";

  for (const routeDef of routes) {
    if (routeDef.method !== method) continue;

    const match = path.match(routeDef.pattern);
    if (!match) continue;

    const params: Record<string, string> = {};
    routeDef.paramNames.forEach((name, index) => {
      params[name] = match[index + 1];
    });

    try {
      const user = await verifyToken(req);
      await routeDef.handler(req, res, user, params);
    } catch (error) {
      const appError = error as { status?: number; message?: string };
      if (!res.headersSent) {
        res.status(appError.status ?? 500).json({ error: appError.message ?? "Erro interno." });
      }
    }

    return;
  }

  res.status(404).json({ error: `Rota nao encontrada: ${method} ${path}` });
}

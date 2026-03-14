import "dotenv/config";
import express from "express";
import cors from "cors";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
let admin, db, authAdmin;

try {
  admin = require("firebase-admin");
  if (!admin.apps.length) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    const dbUrl = process.env.FIREBASE_DATABASE_URL;
    if (!sa || !dbUrl) {
      console.error("Faltam FIREBASE_SERVICE_ACCOUNT e FIREBASE_DATABASE_URL em .env");
      process.exit(1);
    }
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)), databaseURL: dbUrl });
    console.log("Firebase Admin OK");
  }
  db = admin.database();
  authAdmin = admin.auth();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`-> ${req.method} ${req.path} ${JSON.stringify(req.query)}`);
  next();
});

async function verify(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw { status: 401, message: "Token nao fornecido." };
  try {
    const decoded = await authAdmin.verifyIdToken(header.split("Bearer ")[1]);
    return { uid: decoded.uid };
  } catch {
    throw { status: 401, message: "Token invalido." };
  }
}

function auth(handler) {
  return async (req, res) => {
    try {
      const user = await verify(req);
      await handler(req, res, user);
    } catch (error) {
      console.error(error);
      res.status(error.status ?? 500).json({ error: error.message ?? "Erro interno." });
    }
  };
}

function clean(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function str(value, field, max = 500) {
  if (typeof value !== "string" || !value.trim()) throw { status: 400, message: `'${field}' obrigatorio.` };
  if (value.trim().length > max) throw { status: 400, message: `'${field}' muito longo.` };
  return value.trim();
}

function num(value, field) {
  if (typeof value !== "number" || Number.isNaN(value)) throw { status: 400, message: `'${field}' deve ser numero.` };
  return value;
}

function prio(value) {
  return ["low", "medium", "high", "urgent"].includes(value) ? value : "medium";
}

function optionalDateKey(value, field) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = str(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
    throw { status: 400, message: `${field} invalido.` };
  }

  return parsed;
}

function buildDateRange(startDate, endDate) {
  const dates = [];
  const cursor = new Date(`${startDate}T12:00:00`);
  const last = new Date(`${endDate}T12:00:00`);

  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

async function loadTasksByDate(uid, dateKey) {
  const snap = await db.ref(`tasksByDate/${uid}/${dateKey}`).get();
  if (!snap.exists()) return [];

  const ids = Object.keys(snap.val());
  const taskSnaps = await Promise.all(ids.map((id) => db.ref(`tasks/${uid}/${id}`).get()));
  return taskSnaps.filter((taskSnap) => taskSnap.exists()).map((taskSnap) => taskSnap.val());
}

app.get("/api/tasks", auth(async (req, res, { uid }) => {
  const { date, startDate, endDate } = req.query;

  if (date) {
    return res.json({ tasks: await loadTasksByDate(uid, date) });
  }

  if (startDate && endDate) {
    const dates = buildDateRange(startDate, endDate);
    return res.json({ tasks: (await Promise.all(dates.map((dateKey) => loadTasksByDate(uid, dateKey)))).flat() });
  }

  return res
    .status(400)
    .json({ error: "Forneca ?date=yyyy-MM-dd ou ?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd" });
}));

app.post("/api/tasks", auth(async (req, res, { uid }) => {
  const body = req.body;
  const title = str(body.title, "title", 200);
  const date = optionalDateKey(body.date, "date");
  const deadline = optionalDateKey(body.deadline, "deadline");
  if (!date) return res.status(400).json({ error: "Data invalida." });
  if (deadline && deadline < date) {
    return res.status(400).json({ error: "Prazo deve ser igual ou posterior a data." });
  }

  const taskRef = db.ref(`tasks/${uid}`).push();
  const taskId = taskRef.key;
  const now = Date.now();
  const task = clean({
    id: taskId,
    title,
    description: body.description || undefined,
    date,
    deadline,
    priority: prio(body.priority),
    status: "pending",
    categoryId: body.categoryId || undefined,
    createdAt: now,
    updatedAt: now,
  });

  await db.ref().update({
    [`tasks/${uid}/${taskId}`]: task,
    [`tasksByDate/${uid}/${date}/${taskId}`]: true,
  });
  res.status(201).json({ task });
}));

app.patch("/api/tasks/:taskId", auth(async (req, res, { uid }) => {
  const { taskId } = req.params;
  const snap = await db.ref(`tasks/${uid}/${taskId}`).get();
  if (!snap.exists()) return res.status(404).json({ error: "Tarefa nao encontrada." });

  const prev = snap.val();
  const body = req.body;
  const now = Date.now();
  const nextDate = body.date !== undefined ? optionalDateKey(body.date, "date") : undefined;
  const nextDeadline = body.deadline !== undefined ? optionalDateKey(body.deadline, "deadline") : undefined;

  if (body.date !== undefined && !nextDate) {
    return res.status(400).json({ error: "Data invalida." });
  }

  const effectiveDate = nextDate ?? prev.date;
  const effectiveDeadline = body.deadline !== undefined ? nextDeadline : prev.deadline;

  if (effectiveDeadline && effectiveDeadline < effectiveDate) {
    return res.status(400).json({ error: "Prazo deve ser igual ou posterior a data." });
  }

  if (body.action === "complete") {
    await db.ref(`tasks/${uid}/${taskId}`).update({ status: "done", completedAt: now, updatedAt: now });
    return res.json({ success: true });
  }

  if (body.action === "uncomplete") {
    await db.ref(`tasks/${uid}/${taskId}`).update({ status: "pending", completedAt: null, updatedAt: now });
    return res.json({ success: true });
  }

  const updated = clean({
    ...prev,
    ...(body.title ? { title: body.title.trim() } : {}),
    ...(body.description !== undefined ? { description: body.description || undefined } : {}),
    ...(body.priority ? { priority: prio(body.priority) } : {}),
    ...(body.status ? { status: body.status } : {}),
    ...(body.categoryId !== undefined ? { categoryId: body.categoryId || undefined } : {}),
    ...(nextDate ? { date: nextDate } : {}),
    ...(body.deadline !== undefined ? { deadline: nextDeadline } : {}),
    updatedAt: now,
  });

  const updates = { [`tasks/${uid}/${taskId}`]: updated };
  if (nextDate && nextDate !== prev.date) {
    updates[`tasksByDate/${uid}/${prev.date}/${taskId}`] = null;
    updates[`tasksByDate/${uid}/${nextDate}/${taskId}`] = true;
  }

  await db.ref().update(updates);
  res.json({ success: true });
}));

app.delete("/api/tasks/:taskId", auth(async (req, res, { uid }) => {
  const snap = await db.ref(`tasks/${uid}/${req.params.taskId}`).get();
  if (!snap.exists()) return res.status(404).json({ error: "Tarefa nao encontrada." });

  const task = snap.val();
  await db.ref().update({
    [`tasks/${uid}/${req.params.taskId}`]: null,
    [`tasksByDate/${uid}/${task.date}/${req.params.taskId}`]: null,
  });
  res.json({ success: true });
}));

app.get("/api/events", auth(async (req, res, { uid }) => {
  const snap = await db.ref(`events/${uid}`).get();
  if (!snap.exists()) return res.json({ events: [] });

  let events = Object.values(snap.val());
  const { start, end } = req.query;
  if (start && end) {
    events = events.filter((event) => event.startAt >= +start && event.startAt <= +end);
  }

  res.json({ events });
}));

app.post("/api/events", auth(async (req, res, { uid }) => {
  const body = req.body;
  const title = str(body.title, "title", 200);
  const startAt = num(body.startAt, "startAt");
  const endAt = num(body.endAt, "endAt");
  const eventRef = db.ref(`events/${uid}`).push();
  const eventId = eventRef.key;
  const now = Date.now();

  const event = clean({
    id: eventId,
    title,
    description: body.description || undefined,
    startAt,
    endAt,
    allDay: body.allDay === true,
    location: body.location || undefined,
    categoryId: body.categoryId || undefined,
    source: "manual",
    createdAt: now,
    updatedAt: now,
  });

  await db.ref(`events/${uid}/${eventId}`).set(event);
  res.status(201).json({ event });
}));

app.patch("/api/events/:eventId", auth(async (req, res, { uid }) => {
  const snap = await db.ref(`events/${uid}/${req.params.eventId}`).get();
  if (!snap.exists()) return res.status(404).json({ error: "Evento nao encontrado." });

  const updated = clean({ ...snap.val(), ...req.body, updatedAt: Date.now() });
  await db.ref(`events/${uid}/${req.params.eventId}`).set(updated);
  res.json({ success: true });
}));

app.delete("/api/events/:eventId", auth(async (req, res, { uid }) => {
  await db.ref(`events/${uid}/${req.params.eventId}`).remove();
  res.json({ success: true });
}));

app.get("/api/logs", auth(async (req, res, { uid }) => {
  const { month } = req.query;
  const snap = await db.ref(`dailyLogs/${uid}`).get();
  if (!snap.exists()) return res.json({ logs: [] });

  let logs = Object.values(snap.val());
  if (month) {
    logs = logs.filter((log) => log.date?.startsWith(month));
  }

  logs.sort((a, b) => b.date.localeCompare(a.date));
  res.json({ logs });
}));

app.get("/api/logs/:date", auth(async (req, res, { uid }) => {
  const snap = await db.ref(`dailyLogs/${uid}/${req.params.date}`).get();
  res.json({ log: snap.exists() ? snap.val() : null });
}));

app.put("/api/logs/:date", auth(async (req, res, { uid }) => {
  const date = req.params.date;
  const content = str(req.body.content, "content", 10000);
  const existing = await db.ref(`dailyLogs/${uid}/${date}`).get();
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

  await db.ref(`dailyLogs/${uid}/${date}`).set(log);
  res.json({ log });
}));

app.get("/api/categories", auth(async (req, res, { uid }) => {
  const snap = await db.ref(`categories/${uid}`).get();
  res.json({ categories: snap.exists() ? Object.values(snap.val()) : [] });
}));

app.post("/api/categories", auth(async (req, res, { uid }) => {
  const name = str(req.body.name, "name", 50);
  const color = /^#[0-9A-Fa-f]{6}$/.test(req.body.color) ? req.body.color : "#6B7280";
  const type = ["task", "event", "both"].includes(req.body.type) ? req.body.type : "both";
  const categoryRef = db.ref(`categories/${uid}`).push();
  const category = { id: categoryRef.key, name, color, type };
  await db.ref(`categories/${uid}/${categoryRef.key}`).set(category);
  res.status(201).json({ category });
}));

app.patch("/api/categories/:id", auth(async (req, res, { uid }) => {
  const snap = await db.ref(`categories/${uid}/${req.params.id}`).get();
  if (!snap.exists()) return res.status(404).json({ error: "Categoria nao encontrada." });

  const updated = {
    ...snap.val(),
    ...(req.body.name ? { name: req.body.name.trim() } : {}),
    ...(/^#[0-9A-Fa-f]{6}$/.test(req.body.color) ? { color: req.body.color } : {}),
    ...(req.body.type ? { type: req.body.type } : {}),
  };

  await db.ref(`categories/${uid}/${req.params.id}`).set(updated);
  res.json({ category: updated });
}));

app.delete("/api/categories/:id", auth(async (req, res, { uid }) => {
  await db.ref(`categories/${uid}/${req.params.id}`).remove();
  res.json({ success: true });
}));

app.listen(3001, () => console.log("\nAPI dev: http://localhost:3001\n"));

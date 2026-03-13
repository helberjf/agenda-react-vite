/**
 * functions/src/index.ts
 *
 * Entry point das Cloud Functions.
 * Exporta todas as callable functions que o frontend pode chamar.
 *
 * Deploy: firebase deploy --only functions
 *
 * Arquitetura de segurança:
 * - ESCRITAS: todas via Cloud Functions (servidor verifica token)
 * - LEITURAS: direto no Realtime Database (protegidas por Security Rules)
 *
 * Isso garante:
 * 1. Validação server-side não pode ser bypassada pelo frontend
 * 2. Lógica de negócio não fica exposta no bundle JS
 * 3. Rate limiting pode ser adicionado nas functions
 * 4. Auditoria centralizada
 */

export { createTask, updateTask, completeTask, uncompleteTask, deleteTask } from "./tasks";
export { createEvent, updateEvent, deleteEvent } from "./events";
export { upsertDailyLog } from "./logs";

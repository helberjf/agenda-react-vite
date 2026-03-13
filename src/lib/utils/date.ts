/**
 * lib/utils/date.ts
 *
 * Helpers de data para o domínio da aplicação.
 * Usamos date-fns por ser tree-shakeable — não importar tudo de uma vez.
 *
 * Convenções:
 * - dateKey: "yyyy-MM-dd" — chave de acesso no Realtime Database
 * - weekKey: "yyyy-Www"   — semana ISO ex: "2024-W03"
 * - timestamps: Unix ms (number) — armazenado no DB
 */

import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  getISOWeek,
  getYear,
  isToday,
  isSameDay,
  addDays,
  subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Keys ────────────────────────────────────────────────────────────────────

/** Retorna chave de data no formato "yyyy-MM-dd" */
export function toDateKey(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

/** Retorna chave de semana ISO no formato "yyyy-Www" ex: "2024-W03" */
export function toWeekKey(date: Date = new Date()): string {
  const week = getISOWeek(date);
  const year = getYear(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** Parseia uma dateKey de volta para Date */
export function fromDateKey(dateKey: string): Date {
  return parseISO(dateKey);
}

// ─── Ranges ──────────────────────────────────────────────────────────────────

export function startOfDayTs(date: Date = new Date()): number {
  return startOfDay(date).getTime();
}

export function endOfDayTs(date: Date = new Date()): number {
  return endOfDay(date).getTime();
}

export function startOfWeekTs(date: Date = new Date(), weekStartsOn: 0 | 1 = 1): number {
  return startOfWeek(date, { weekStartsOn }).getTime();
}

export function endOfWeekTs(date: Date = new Date(), weekStartsOn: 0 | 1 = 1): number {
  return endOfWeek(date, { weekStartsOn }).getTime();
}

// ─── Display ─────────────────────────────────────────────────────────────────

export function formatDateBR(date: Date | number): string {
  return format(typeof date === "number" ? new Date(date) : date, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTimeBR(date: Date | number): string {
  return format(typeof date === "number" ? new Date(date) : date, "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });
}

export function formatWeekLabel(weekKey: string): string {
  // "2024-W03" → "Semana 3, 2024"
  const [year, w] = weekKey.split("-W");
  return `Semana ${parseInt(w)}, ${year}`;
}

export function formatRelative(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  if (isToday(d)) return "Hoje";
  if (isSameDay(d, addDays(new Date(), 1))) return "Amanhã";
  if (isSameDay(d, subDays(new Date(), 1))) return "Ontem";
  return formatDateBR(d);
}

export function startOfMonthTs(year: number, month: number): number {
  return new Date(year, month, 1).getTime();
}

export function endOfMonthTs(year: number, month: number): number {
  return new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
}

export { isToday, isSameDay, addDays, subDays, format, parseISO, ptBR };

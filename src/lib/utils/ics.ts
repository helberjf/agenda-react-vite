/**
 * lib/utils/ics.ts
 *
 * Exportação de eventos no formato iCalendar (.ics) — RFC 5545.
 * Compatível com Apple Calendar, Google Calendar e Outlook.
 *
 * Limitações MVP:
 * - Sem RRULE (recorrência)
 * - Sem ALARM/VALARM
 * - Timezone fixo via TZID — produção deve usar tzdata completo
 *
 * Para integração real com Apple Calendar (CalDAV), veja:
 * https://developer.apple.com/library/archive/documentation/AppleApplications/Conceptual/SafariJSProgGuide/
 */

import type { CalendarEvent } from "@/types";
import { format } from "date-fns";

function escapeICS(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function toICSDate(ts: number, allDay = false): string {
  const d = new Date(ts);
  if (allDay) return format(d, "yyyyMMdd");
  return format(d, "yyyyMMdd'T'HHmmss");
}

function generateUID(eventId: string): string {
  return `${eventId}@agenda-app`;
}

export function eventToICS(event: CalendarEvent): string {
  const now = format(new Date(), "yyyyMMdd'T'HHmmss");
  const dtstart = event.allDay
    ? `DTSTART;VALUE=DATE:${toICSDate(event.startAt, true)}`
    : `DTSTART:${toICSDate(event.startAt)}`;
  const dtend = event.allDay
    ? `DTEND;VALUE=DATE:${toICSDate(event.endAt, true)}`
    : `DTEND:${toICSDate(event.endAt)}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agenda App//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${generateUID(event.id)}`,
    `DTSTAMP:${now}`,
    dtstart,
    dtend,
    `SUMMARY:${escapeICS(event.title)}`,
    event.description ? `DESCRIPTION:${escapeICS(event.description)}` : null,
    event.location ? `LOCATION:${escapeICS(event.location)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return lines;
}

export function eventsToICS(events: CalendarEvent[]): string {
  const now = format(new Date(), "yyyyMMdd'T'HHmmss");

  const eventBlocks = events.map((event) => {
    const dtstart = event.allDay
      ? `DTSTART;VALUE=DATE:${toICSDate(event.startAt, true)}`
      : `DTSTART:${toICSDate(event.startAt)}`;
    const dtend = event.allDay
      ? `DTEND;VALUE=DATE:${toICSDate(event.endAt, true)}`
      : `DTEND:${toICSDate(event.endAt)}`;

    return [
      "BEGIN:VEVENT",
      `UID:${generateUID(event.id)}`,
      `DTSTAMP:${now}`,
      dtstart,
      dtend,
      `SUMMARY:${escapeICS(event.title)}`,
      event.description ? `DESCRIPTION:${escapeICS(event.description)}` : null,
      event.location ? `LOCATION:${escapeICS(event.location)}` : null,
      "END:VEVENT",
    ]
      .filter(Boolean)
      .join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agenda App//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...eventBlocks,
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Dispara download do arquivo .ics no browser.
 *
 * Para integração com iPhone Calendar:
 * - Hospedar o arquivo em servidor com Content-Type: text/calendar
 * - iPhone abre automaticamente com opção "Adicionar ao Calendário"
 * - CalDAV é mais robusto para sync bidirecional — requer backend
 */
export function downloadICS(content: string, filename = "agenda.ics"): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

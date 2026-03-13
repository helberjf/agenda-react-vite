/**
 * pages/CalendarPage.tsx
 *
 * Calendário com FullCalendar.
 * Integra eventos do Firebase e suporta criação por clique no dia.
 */

import { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg, DateSelectArg, EventDropArg } from "@fullcalendar/core";
import { useMonthEvents, useUpdateEvent, useDeleteEvent } from "@/hooks/useEvents";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import type { CalendarEvent } from "@/types";

// Mapeia CalendarEvent → formato FullCalendar
function toFCEvent(event: CalendarEvent) {
  return {
    id: event.id,
    title: event.title,
    start: new Date(event.startAt),
    end: new Date(event.endAt),
    allDay: event.allDay ?? false,
    extendedProps: { event },
    color: "#3B82F6",
  };
}

export function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const { events, loading } = useMonthEvents(currentYear, currentMonth);
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { openNewEvent } = useUIStore();

  const fcEvents = events.map(toFCEvent);

  function handleDateSelect(info: DateSelectArg) {
    openNewEvent(info.start.getTime());
  }

  function handleEventClick(info: EventClickArg) {
    const event = info.event.extendedProps.event as CalendarEvent;
    setSelectedEvent(event);
  }

  async function handleEventDrop(info: EventDropArg) {
    const event = info.event.extendedProps.event as CalendarEvent;
    const duration = event.endAt - event.startAt;
    const newStart = info.event.start!.getTime();

    try {
      await updateEvent.mutateAsync({
        id: event.id,
        input: { startAt: newStart, endAt: newStart + duration },
      });
    } catch {
      info.revert();
      toast.error("Erro ao mover evento");
    }
  }

  async function handleDeleteSelected() {
    if (!selectedEvent) return;
    try {
      await deleteEvent.mutateAsync(selectedEvent.id);
      toast.success("Evento excluído");
      setSelectedEvent(null);
    } catch {
      toast.error("Erro ao excluir evento");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Calendário</h1>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-1">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            locale="pt-br"
            events={fcEvents}
            selectable
            editable
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            datesSet={(info) => {
              const mid = new Date((info.start.getTime() + info.end.getTime()) / 2);
              setCurrentYear(mid.getFullYear());
              setCurrentMonth(mid.getMonth());
            }}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            buttonText={{
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              day: "Dia",
              list: "Lista",
            }}
            height="auto"
            aspectRatio={1.8}
            nowIndicator
            dayMaxEvents={3}
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: false }}
          />
        </div>
      </div>

      {/* Painel de evento selecionado */}
      {selectedEvent && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm z-40 p-4 bg-card border border-border rounded-xl shadow-xl animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{selectedEvent.title}</p>
              {selectedEvent.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {selectedEvent.description}
                </p>
              )}
              {selectedEvent.location && (
                <p className="text-xs text-muted-foreground mt-0.5">📍 {selectedEvent.location}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(selectedEvent.startAt).toLocaleString("pt-BR", {
                  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                })}
                {" → "}
                {new Date(selectedEvent.endAt).toLocaleString("pt-BR", {
                  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleDeleteSelected}
                disabled={deleteEvent.isPending}
                className="px-3 py-1.5 text-xs rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                Excluir
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-3 py-1.5 text-xs rounded-lg hover:bg-accent text-muted-foreground"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

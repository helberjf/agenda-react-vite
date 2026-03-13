import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import {
  subscribeEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvents,
} from "@/services/events.service";
import type { CalendarEvent } from "@/types";
import type { CreateEventInput, UpdateEventInput } from "@/lib/validators/event";
// date utils imported below

export function useMonthEvents(year: number, month: number) {
  const uid = useAuthStore((s) => s.user?.uid);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const start = new Date(year, month, 1).getTime();
    const end = new Date(year, month + 1, 0, 23, 59, 59).getTime();

    const unsubscribe = subscribeEvents(uid, start, end, (evs) => {
      setEvents(evs);
      setLoading(false);
    });
    return unsubscribe;
  }, [uid, year, month]);

  return { events, loading };
}

export function useCreateEvent() {
  const uid = useAuthStore((s) => s.user?.uid);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventInput) => createEvent(uid!, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useUpdateEvent() {
  const uid = useAuthStore((s) => s.user?.uid);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEventInput }) =>
      updateEvent(uid!, id, input),
  });
}

export function useDeleteEvent() {
  const uid = useAuthStore((s) => s.user?.uid);

  return useMutation({
    mutationFn: (id: string) => deleteEvent(uid!, id),
  });
}

export function useExportAllEvents() {
  const uid = useAuthStore((s) => s.user?.uid);

  return useMutation({
    mutationFn: () => getAllEvents(uid!),
  });
}

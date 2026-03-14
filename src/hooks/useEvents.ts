import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvents,
  getEventsInRange,
} from "@/services/events.service";
import type { CreateEventInput, UpdateEventInput } from "@/lib/validators/event";

const EVENTS_STALE_TIME = 30 * 1000;

export function useEvents() {
  const uid = useAuthStore((s) => s.user?.uid);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events", "all", uid],
    queryFn: () => getAllEvents(uid!),
    enabled: !!uid,
    staleTime: EVENTS_STALE_TIME,
  });

  return { events, loading: isLoading };
}

export function useMonthEvents(year: number, month: number) {
  const uid = useAuthStore((s) => s.user?.uid);
  const startTs = new Date(year, month, 1).getTime();
  const endTs = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events", "month", uid, year, month],
    queryFn: () => getEventsInRange(uid!, startTs, endTs),
    enabled: !!uid,
    staleTime: EVENTS_STALE_TIME,
  });

  return { events, loading: isLoading };
}

export function useEventsInRange(startTs: number, endTs: number) {
  const uid = useAuthStore((s) => s.user?.uid);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events", "range", uid, startTs, endTs],
    queryFn: () => getEventsInRange(uid!, startTs, endTs),
    enabled: !!uid,
    staleTime: EVENTS_STALE_TIME,
  });

  return { events, loading: isLoading };
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
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEventInput }) =>
      updateEvent(uid!, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useDeleteEvent() {
  const uid = useAuthStore((s) => s.user?.uid);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEvent(uid!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useExportAllEvents() {
  const uid = useAuthStore((s) => s.user?.uid);

  return useMutation({
    mutationFn: () => getAllEvents(uid!),
  });
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { useCreateEvent } from "@/hooks/useEvents";
import { createEventSchema, type CreateEventInput } from "@/lib/validators/event";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";

function toInputDatetime(ts: number): string {
  return format(new Date(ts), "yyyy-MM-dd'T'HH:mm");
}

function fromInputDatetime(str: string): number {
  return new Date(str).getTime();
}

export function NewEventModal() {
  const { newEventOpen, newEventDefaultDate, closeNewEvent } = useUIStore();
  const createEvent = useCreateEvent();

  const defaultStart = newEventDefaultDate ?? Date.now();
  const defaultEnd = defaultStart + 60 * 60 * 1000; // +1h

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ title: string; startAt: string; endAt: string; description?: string; location?: string; allDay: boolean }>({
    defaultValues: {
      startAt: toInputDatetime(defaultStart),
      endAt: toInputDatetime(defaultEnd),
      allDay: false,
    },
  });

  async function onSubmit(data: { title: string; startAt: string; endAt: string; description?: string; location?: string; allDay: boolean }) {
    try {
      await createEvent.mutateAsync({
        title: data.title,
        startAt: fromInputDatetime(data.startAt),
        endAt: fromInputDatetime(data.endAt),
        description: data.description,
        location: data.location,
        allDay: data.allDay,
      });
      toast.success("Evento criado");
      reset();
      closeNewEvent();
    } catch {
      toast.error("Erro ao criar evento");
    }
  }

  if (!newEventOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={closeNewEvent} />

      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Novo evento</h2>
          <button onClick={closeNewEvent} className="p-1 rounded hover:bg-accent text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
          <input
            {...register("title", { required: "Título obrigatório" })}
            placeholder="Título do evento"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoFocus
          />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Início</label>
              <input
                type="datetime-local"
                {...register("startAt")}
                className="w-full mt-1 bg-background border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Fim</label>
              <input
                type="datetime-local"
                {...register("endAt")}
                className="w-full mt-1 bg-background border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <input
            {...register("location")}
            placeholder="Local (opcional)"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          <textarea
            {...register("description")}
            placeholder="Descrição (opcional)"
            rows={2}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("allDay")} className="rounded border-border" />
            Dia inteiro
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={closeNewEvent} className="px-4 py-2 text-sm rounded-lg hover:bg-accent text-muted-foreground">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createEvent.isPending}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createEvent.isPending ? "Criando..." : "Criar evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

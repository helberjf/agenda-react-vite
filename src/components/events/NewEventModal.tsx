import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useUIStore } from "@/store/ui.store";
import { useCreateEvent } from "@/hooks/useEvents";

type EventFormValues = {
  title: string;
  startAt: string;
  endAt: string;
  description?: string;
  location?: string;
  allDay: boolean;
};

function toInputDatetime(ts: number): string {
  return format(new Date(ts), "yyyy-MM-dd'T'HH:mm");
}

function fromInputDatetime(value: string): number {
  return new Date(value).getTime();
}

export function NewEventModal() {
  const { newEventOpen, newEventDefaultDate, closeNewEvent } = useUIStore();
  const createEvent = useCreateEvent();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    defaultValues: {
      title: "",
      startAt: toInputDatetime(Date.now()),
      endAt: toInputDatetime(Date.now() + 60 * 60 * 1000),
      description: "",
      location: "",
      allDay: false,
    },
  });

  useEffect(() => {
    if (!newEventOpen) return;

    const start = newEventDefaultDate ?? Date.now();
    const end = start + 60 * 60 * 1000;

    reset({
      title: "",
      startAt: toInputDatetime(start),
      endAt: toInputDatetime(end),
      description: "",
      location: "",
      allDay: false,
    });
  }, [newEventOpen, newEventDefaultDate, reset]);

  async function onSubmit(data: EventFormValues) {
    try {
      await createEvent.mutateAsync({
        title: data.title,
        startAt: fromInputDatetime(data.startAt),
        endAt: fromInputDatetime(data.endAt),
        description: data.description,
        location: data.location,
        allDay: data.allDay,
      });
      toast.success("Agendamento criado");
      closeNewEvent();
    } catch {
      toast.error("Erro ao criar agendamento");
    }
  }

  if (!newEventOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={closeNewEvent} />

      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Novo agendamento</h2>
          <button onClick={closeNewEvent} className="p-1 rounded hover:bg-accent text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
          <input
            {...register("title", { required: "Titulo obrigatorio" })}
            placeholder="Titulo do agendamento"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoFocus
          />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Inicio</label>
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
            placeholder="Descricao (opcional)"
            rows={2}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("allDay")} className="rounded border-border" />
            Dia inteiro
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeNewEvent}
              className="px-4 py-2 text-sm rounded-lg hover:bg-accent text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createEvent.isPending}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createEvent.isPending ? "Criando..." : "Criar agendamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

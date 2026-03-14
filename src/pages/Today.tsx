import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarRange, CheckCircle2, Circle, Plus, Smile } from "lucide-react";
import { toast } from "sonner";
import { useTodayTasks, useCreateTask } from "@/hooks/useTasks";
import { useEventsInRange } from "@/hooks/useEvents";
import { useDailyLog, useUpsertDailyLog } from "@/hooks/useDailyLog";
import { useCategories } from "@/hooks/useCategories";
import { TaskCard } from "@/components/tasks/TaskCard";
import { EventCard } from "@/components/events/EventCard";
import { CategoryTabs } from "@/components/shared/CategoryTabs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { AgendaTypeFilter, type AgendaTypeFilterValue } from "@/components/shared/AgendaTypeFilter";
import { formatDateBR, toDateKey, startOfDayTs, endOfDayTs } from "@/lib/utils/date";
import { dailyLogSchema, type DailyLogInput } from "@/lib/validators/auth";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validators/task";
import { cn } from "@/lib/utils/cn";
import type { Task, CalendarEvent } from "@/types";

const MOODS = [
  { value: "great", emoji: "😄", label: "Otimo" },
  { value: "good", emoji: "🙂", label: "Bem" },
  { value: "neutral", emoji: "😐", label: "Ok" },
  { value: "bad", emoji: "😕", label: "Ruim" },
  { value: "terrible", emoji: "😞", label: "Pessimo" },
] as const;

function QuickAddTask({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const createTask = useCreateTask();
  const { categories } = useCategories();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { priority: "medium", date, deadline: undefined },
  });

  const deadline = watch("deadline");

  async function onSubmit(data: CreateTaskInput) {
    try {
      await createTask.mutateAsync(data);
      toast.success("Tarefa adicionada");
      reset({ priority: "medium", date, deadline: undefined });
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar tarefa");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-muted-foreground border border-dashed border-border rounded-xl hover:border-primary/50 hover:text-primary transition-colors"
      >
        <Plus className="h-4 w-4" />
        Adicionar tarefa para hoje
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border border-primary/40 rounded-xl p-3.5 space-y-2.5 bg-secondary/30"
    >
      <input
        {...register("title")}
        placeholder="Titulo da tarefa..."
        autoFocus
        className={cn(
          "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50",
          errors.title && "border-destructive"
        )}
      />
      <div className="grid gap-2 sm:grid-cols-[auto,1fr]">
        <select
          {...register("priority")}
          className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none"
        >
          <option value="low">Baixa</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>

        <select
          {...register("categoryId")}
          className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none"
        >
          <option value="">Sem categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          min={date}
          {...register("deadline")}
          className={cn(
            "bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50",
            errors.deadline && "border-destructive"
          )}
        />
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[11px] text-muted-foreground">
          {deadline ? `Prazo: ${deadline}` : "Prazo opcional"}
        </p>
        {errors.deadline && <p className="text-[11px] text-destructive">{errors.deadline.message}</p>}

        <button
          type="submit"
          disabled={createTask.isPending}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {createTask.isPending ? "..." : "Salvar"}
        </button>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-xs rounded-lg hover:bg-accent text-muted-foreground"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function DailyLogSection({ dateKey, date }: { dateKey: string; date: Date }) {
  const { log, loading } = useDailyLog(date);
  const upsert = useUpsertDailyLog();
  const [selectedMood, setSelectedMood] = useState<DailyLogInput["mood"]>(undefined);

  useEffect(() => {
    setSelectedMood(log?.mood);
  }, [log?.mood]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DailyLogInput>({
    resolver: zodResolver(dailyLogSchema),
    values: { content: log?.content ?? "", mood: log?.mood },
  });

  async function onSubmit(data: DailyLogInput) {
    try {
      await upsert.mutateAsync({ dateKey, input: { ...data, mood: selectedMood } });
      toast.success("Registro salvo");
    } catch {
      toast.error("Erro ao salvar registro");
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <textarea
        {...register("content")}
        placeholder={"O que voce fez hoje? O que aprendeu?\n\nEscreva livremente - este e seu diario de produtividade."}
        rows={5}
        className={cn(
          "w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none leading-relaxed",
          errors.content && "border-destructive"
        )}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <Smile className="h-4 w-4 text-muted-foreground mr-1.5" />
          {MOODS.map((mood) => (
            <button
              key={mood.value}
              type="button"
              onClick={() => setSelectedMood(mood.value as DailyLogInput["mood"])}
              title={mood.label}
              className={cn(
                "text-xl p-1 rounded-lg transition-all",
                selectedMood === mood.value ? "scale-125" : "opacity-40 hover:opacity-80"
              )}
            >
              {mood.emoji}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={upsert.isPending}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {upsert.isPending ? "Salvando..." : log ? "Atualizar" : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function countByCategory(categories: { id: string }[], items: Array<{ categoryId?: string }>) {
  const counts: Record<string, number> = {};
  categories.forEach((category) => {
    counts[category.id] = items.filter((item) => item.categoryId === category.id).length;
  });
  return counts;
}

export function Today() {
  const today = new Date();
  const dateKey = toDateKey(today);
  const { tasks, loading: tasksLoading } = useTodayTasks(today);
  const { events, loading: eventsLoading } = useEventsInRange(startOfDayTs(today), endOfDayTs(today));
  const { categories } = useCategories();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [agendaFilter, setAgendaFilter] = useState<AgendaTypeFilterValue>("all");

  const loading = tasksLoading || eventsLoading;
  const filteredTasks = activeCategoryId ? tasks.filter((task) => task.categoryId === activeCategoryId) : tasks;
  const filteredEvents = activeCategoryId ? events.filter((event) => event.categoryId === activeCategoryId) : events;
  const visibleTasks = agendaFilter === "events" ? [] : filteredTasks;
  const visibleEvents = agendaFilter === "tasks" ? [] : filteredEvents;
  const pendingTasks = visibleTasks.filter((task) => task.status !== "done");
  const doneTasks = visibleTasks.filter((task) => task.status === "done");
  const allDone = tasks.filter((task) => task.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((allDone / tasks.length) * 100) : 0;
  const countBase: Array<Task | CalendarEvent> =
    agendaFilter === "tasks" ? tasks : agendaFilter === "events" ? events : [...tasks, ...events];
  const categoryCounts = countByCategory(categories, countBase);
  const agendaCounts = { all: tasks.length + events.length, tasks: tasks.length, events: events.length };
  const isEmpty = !loading && visibleTasks.length === 0 && visibleEvents.length === 0;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{formatDateBR(today)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tasks.length} tarefa(s) · {events.length} agendamento(s)
          </p>
        </div>
        {tasks.length > 0 && (
          <span className={cn("text-2xl font-bold", progress === 100 ? "text-green-400" : "text-primary")}>
            {progress}%
          </span>
        )}
      </div>

      {tasks.length > 0 && (
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", progress === 100 ? "bg-green-500" : "bg-primary")}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <AgendaTypeFilter value={agendaFilter} onChange={setAgendaFilter} counts={agendaCounts} />

      {categories.length > 0 && (
        <CategoryTabs
          categories={categories}
          activeId={activeCategoryId}
          onChange={setActiveCategoryId}
          counts={categoryCounts}
        />
      )}

      {loading ? (
        <LoadingSpinner />
      ) : isEmpty ? (
        <EmptyState
          icon={<CalendarRange className="h-8 w-8" />}
          title="Nada para este filtro"
          description="Nao ha tarefas ou agendamentos para a combinacao selecionada."
        />
      ) : (
        <div className="space-y-5">
          {visibleEvents.length > 0 && (
            <section className="space-y-2.5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CalendarRange className="h-3.5 w-3.5 text-emerald-500" />
                Agendamentos ({visibleEvents.length})
              </h2>
              <div className="space-y-2">
                {visibleEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {agendaFilter !== "events" && (
            <section className="space-y-2.5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Circle className="h-3.5 w-3.5" />
                Pendentes ({pendingTasks.length})
              </h2>
              <div className="space-y-2">
                {pendingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                <QuickAddTask date={dateKey} />
              </div>
            </section>
          )}

          {agendaFilter !== "events" && doneTasks.length > 0 && (
            <section className="space-y-2.5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                Concluidas ({doneTasks.length})
              </h2>
              <div className="space-y-2">
                {doneTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <div className="border-t border-border" />

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registro do dia</h2>
        <DailyLogSection dateKey={dateKey} date={today} />
      </section>
    </div>
  );
}

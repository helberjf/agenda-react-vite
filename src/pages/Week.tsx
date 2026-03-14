import { useState } from "react";
import { addDays, addWeeks, format, isToday, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { useWeeklyTasks } from "@/hooks/useTasks";
import { useEventsInRange } from "@/hooks/useEvents";
import { useCategories } from "@/hooks/useCategories";
import { useUIStore } from "@/store/ui.store";
import { TaskCard } from "@/components/tasks/TaskCard";
import { EventCard } from "@/components/events/EventCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { AgendaTypeFilter, type AgendaTypeFilterValue } from "@/components/shared/AgendaTypeFilter";
import { cn } from "@/lib/utils/cn";
import { endOfDayTs, formatWeekLabel, startOfWeekTs, toDateKey, toWeekKey } from "@/lib/utils/date";
import type { CalendarEvent, Task } from "@/types";

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

function countByCategory(categories: { id: string }[], items: Array<{ categoryId?: string }>) {
  const counts: Record<string, number> = {};
  categories.forEach((category) => {
    counts[category.id] = items.filter((item) => item.categoryId === category.id).length;
  });
  return counts;
}

export function Week() {
  const [refDate, setRefDate] = useState(new Date());
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [agendaFilter, setAgendaFilter] = useState<AgendaTypeFilterValue>("all");
  const { openQuickTask, openNewEvent } = useUIStore();
  const { tasks, loading: tasksLoading, weekStart, dateKeys } = useWeeklyTasks(refDate);
  const weekEnd = addDays(weekStart, 6);
  const { events, loading: eventsLoading } = useEventsInRange(startOfWeekTs(refDate, 1), endOfDayTs(weekEnd));
  const { categories } = useCategories();

  const loading = tasksLoading || eventsLoading;
  const filteredTasks = activeCategoryId ? tasks.filter((task) => task.categoryId === activeCategoryId) : tasks;
  const filteredEvents = activeCategoryId ? events.filter((event) => event.categoryId === activeCategoryId) : events;
  const visibleTasks = agendaFilter === "events" ? [] : filteredTasks;
  const visibleEvents = agendaFilter === "tasks" ? [] : filteredEvents;
  const done = tasks.filter((task) => task.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
  const categoryBase: Array<Task | CalendarEvent> =
    agendaFilter === "tasks" ? tasks : agendaFilter === "events" ? events : [...tasks, ...events];
  const categoryCounts = countByCategory(categories, categoryBase);
  const agendaCounts = { all: tasks.length + events.length, tasks: tasks.length, events: events.length };

  const tasksByDate = new Map<string, Task[]>();
  const eventsByDate = new Map<string, CalendarEvent[]>();
  dateKeys.forEach((dateKey) => {
    tasksByDate.set(dateKey, []);
    eventsByDate.set(dateKey, []);
  });

  visibleTasks.forEach((task) => {
    const existing = tasksByDate.get(task.date) ?? [];
    tasksByDate.set(task.date, [...existing, task]);
  });

  visibleEvents.forEach((event) => {
    const eventDateKey = toDateKey(new Date(event.startAt));
    const existing = eventsByDate.get(eventDateKey) ?? [];
    eventsByDate.set(eventDateKey, [...existing, event]);
  });

  const totalVisible = visibleTasks.length + visibleEvents.length;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{formatWeekLabel(toWeekKey(refDate))}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tasks.length} tarefa(s) · {events.length} agendamento(s)
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRefDate((date) => subWeeks(date, 1))}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setRefDate(new Date())}
            className="px-2.5 py-1 text-xs rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={() => setRefDate((date) => addWeeks(date, 1))}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="space-y-2">
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", progress === 100 ? "bg-green-500" : "bg-primary")}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{done}/{tasks.length} tarefas concluidas</p>
        </div>
      )}

      <AgendaTypeFilter value={agendaFilter} onChange={setAgendaFilter} counts={agendaCounts} />

      {categories.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveCategoryId(null)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-full transition-colors",
              !activeCategoryId ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            Todas
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategoryId(activeCategoryId === category.id ? null : category.id)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-full transition-colors",
                activeCategoryId === category.id ? "text-white" : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
              style={activeCategoryId === category.id ? { backgroundColor: category.color } : {}}
              title={`${categoryCounts[category.id] ?? 0} item(s)`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-7 gap-1">
        {dateKeys.map((dateKey, index) => {
          const date = addDays(weekStart, index);
          const dayTasks = tasksByDate.get(dateKey) ?? [];
          const dayEvents = eventsByDate.get(dateKey) ?? [];
          const doneTasks = dayTasks.filter((task) => task.status === "done").length;
          const currentDay = isToday(date);

          return (
            <div
              key={dateKey}
              className={cn(
                "flex flex-col items-center py-2 rounded-xl transition-colors cursor-default",
                currentDay ? "bg-primary/15" : "hover:bg-secondary"
              )}
            >
              <span className={cn("text-[10px] font-medium", currentDay ? "text-primary" : "text-muted-foreground")}>
                {DAY_NAMES[index]}
              </span>
              <span className={cn("text-sm font-semibold mt-0.5", currentDay ? "text-primary" : "text-foreground")}>
                {format(date, "d")}
              </span>
              {(dayTasks.length > 0 || dayEvents.length > 0) && (
                <div className="flex gap-0.5 mt-1">
                  {dayEvents.length > 0 && <span className="h-1 w-1 rounded-full bg-emerald-500" />}
                  {doneTasks > 0 && <span className="h-1 w-1 rounded-full bg-green-400" />}
                  {dayTasks.length - doneTasks > 0 && <span className="h-1 w-1 rounded-full bg-primary/60" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : totalVisible === 0 ? (
        <div className="text-center py-12 space-y-3">
          <EmptyState
            icon={<CalendarRange className="h-8 w-8" />}
            title="Nada nesta semana"
            description="Nao ha tarefas ou agendamentos para o filtro selecionado."
          />
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={openQuickTask}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Nova tarefa
            </button>
            <button
              onClick={() => openNewEvent()}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-accent transition-colors"
            >
              Novo agendamento
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {dateKeys.map((dateKey, index) => {
            const date = addDays(weekStart, index);
            const dayTasks = tasksByDate.get(dateKey) ?? [];
            const dayEvents = eventsByDate.get(dateKey) ?? [];
            const currentDay = isToday(date);

            return (
              <div key={dateKey} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wider",
                      currentDay ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {DAY_NAMES[index]} · {format(date, "d 'de' MMM", { locale: ptBR })}
                  </h3>
                  <span className="text-[10px] text-muted-foreground">
                    {dayTasks.length + dayEvents.length} item(s)
                  </span>
                </div>

                {dayEvents.length === 0 && dayTasks.length === 0 ? (
                  <div className="py-3 text-xs text-muted-foreground/50 text-center border border-dashed border-border rounded-xl">
                    Sem itens
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayEvents.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] uppercase tracking-wider text-emerald-500 font-semibold">
                          Agendamentos
                        </p>
                        {dayEvents.map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                      </div>
                    )}

                    {dayTasks.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Tarefas
                        </p>
                        {dayTasks.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

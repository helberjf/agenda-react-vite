import { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import ptBRLocale from "@fullcalendar/core/locales/pt-br";
import { CalendarRange, ListTodo, Plus } from "lucide-react";
import { useEventsInRange } from "@/hooks/useEvents";
import { useTasksInRange } from "@/hooks/useTasks";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils/cn";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { AgendaTypeFilter, type AgendaTypeFilterValue } from "@/components/shared/AgendaTypeFilter";
import { EventCard } from "@/components/events/EventCard";
import { TaskCard } from "@/components/tasks/TaskCard";
import { endOfMonthTs, startOfMonthTs, toDateKey } from "@/lib/utils/date";

const VIEWS = [
  { key: "dayGridMonth", label: "Mes" },
  { key: "timeGridWeek", label: "Semana" },
  { key: "listWeek", label: "Lista" },
];

function EmptyAgendaSection({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
      Nenhum {label.toLowerCase()} neste periodo.
    </div>
  );
}

export function CalendarPage() {
  const now = new Date();
  const calRef = useRef<FullCalendar>(null);
  const { openNewEvent } = useUIStore();
  const [activeView, setActiveView] = useState("dayGridMonth");
  const [agendaFilter, setAgendaFilter] = useState<AgendaTypeFilterValue>("all");
  const [visibleRange, setVisibleRange] = useState({
    startTs: startOfMonthTs(now.getFullYear(), now.getMonth()),
    endTs: endOfMonthTs(now.getFullYear(), now.getMonth()),
    startDate: toDateKey(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: toDateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  });

  const { events, loading: eventsLoading } = useEventsInRange(visibleRange.startTs, visibleRange.endTs);
  const { data: tasks = [], isLoading: tasksLoading } = useTasksInRange(visibleRange.startDate, visibleRange.endDate);
  const loading = eventsLoading || tasksLoading;

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.startAt - b.startAt),
    [events]
  );

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const dateOrder = a.date.localeCompare(b.date);
        if (dateOrder !== 0) return dateOrder;
        return (a.deadline ?? "").localeCompare(b.deadline ?? "");
      }),
    [tasks]
  );

  const visibleEvents = agendaFilter === "tasks" ? [] : sortedEvents;
  const visibleTasks = agendaFilter === "events" ? [] : sortedTasks;
  const agendaCounts = { all: tasks.length + events.length, tasks: tasks.length, events: events.length };

  const calendarItems = useMemo(
    () => [
      ...visibleEvents.map((event) => ({
        id: `event-${event.id}`,
        title: event.title,
        start: new Date(event.startAt),
        end: new Date(event.endAt),
        allDay: event.allDay ?? false,
        backgroundColor: "#10b981",
        borderColor: "#10b981",
        textColor: "#ffffff",
      })),
      ...visibleTasks.map((task) => ({
        id: `task-${task.id}`,
        title: task.status === "done" ? `Concluida: ${task.title}` : task.title,
        start: task.date,
        allDay: true,
        backgroundColor: task.status === "done" ? "#94a3b8" : "#f59e0b",
        borderColor: task.status === "done" ? "#94a3b8" : "#f59e0b",
        textColor: "#111827",
      })),
    ],
    [visibleEvents, visibleTasks]
  );

  function switchView(view: string) {
    setActiveView(view);
    calRef.current?.getApi().changeView(view);
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-0.5 rounded-lg bg-secondary p-0.5">
          {VIEWS.map((view) => (
            <button
              key={view.key}
              onClick={() => switchView(view.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeView === view.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {view.label}
            </button>
          ))}
        </div>

        <AgendaTypeFilter value={agendaFilter} onChange={setAgendaFilter} counts={agendaCounts} />

        <button
          onClick={() => openNewEvent()}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo agendamento
        </button>

        <div className="text-xs text-muted-foreground">
          {tasks.length} tarefa(s) - {events.length} agendamento(s)
        </div>

        <div className="ml-auto flex gap-1">
          <button
            onClick={() => calRef.current?.getApi().prev()}
            className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent"
          >
            {"<"}
          </button>
          <button
            onClick={() => calRef.current?.getApi().today()}
            className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent"
          >
            Hoje
          </button>
          <button
            onClick={() => calRef.current?.getApi().next()}
            className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent"
          >
            {">"}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr),360px]">
            <div className="calendar-wrapper min-h-[420px] rounded-2xl border border-border bg-card p-3 xl:min-h-0">
              <FullCalendar
                ref={calRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView={activeView}
                locale={ptBRLocale}
                headerToolbar={false}
                height="100%"
                events={calendarItems}
                nowIndicator
                selectable
                editable={false}
                dayMaxEvents={3}
                eventClassNames="cursor-pointer"
                dateClick={(arg) => openNewEvent(arg.date.getTime())}
                select={(arg) => openNewEvent(arg.start.getTime())}
                datesSet={(arg) => {
                  const inclusiveEnd = new Date(arg.end.getTime() - 1);
                  setActiveView(arg.view.type);
                  setVisibleRange({
                    startTs: arg.start.getTime(),
                    endTs: arg.end.getTime() - 1,
                    startDate: toDateKey(arg.start),
                    endDate: toDateKey(inclusiveEnd),
                  });
                }}
              />
            </div>

            <aside className="min-h-0 rounded-2xl border border-border bg-card p-4 xl:overflow-y-auto">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Separado por tipo</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  As tarefas e os agendamentos do periodo visivel aparecem em blocos diferentes.
                </p>
              </div>

              <div className="space-y-5">
                {agendaFilter !== "tasks" && (
                  <section className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <CalendarRange className="h-4 w-4 text-emerald-500" />
                      <h2 className="text-sm font-semibold text-foreground">Agendamentos</h2>
                      <span className="text-xs text-muted-foreground">({visibleEvents.length})</span>
                    </div>

                    {visibleEvents.length === 0 ? (
                      <EmptyAgendaSection label="agendamento" />
                    ) : (
                      <div className="space-y-2">
                        {visibleEvents.map((event) => (
                          <EventCard key={event.id} event={event} showDate />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {agendaFilter !== "events" && (
                  <section className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <ListTodo className="h-4 w-4 text-amber-500" />
                      <h2 className="text-sm font-semibold text-foreground">Tarefas</h2>
                      <span className="text-xs text-muted-foreground">({visibleTasks.length})</span>
                    </div>

                    {visibleTasks.length === 0 ? (
                      <EmptyAgendaSection label="tarefa" />
                    ) : (
                      <div className="space-y-2">
                        {visibleTasks.map((task) => (
                          <TaskCard key={task.id} task={task} showDate />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

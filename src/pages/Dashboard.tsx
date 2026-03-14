import { Calendar, CalendarPlus, CheckCircle2, Circle, Clock3, MapPin, Pencil, TrendingUp, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useTodayTasks, useWeeklyTasks } from "@/hooks/useTasks";
import { useEventsInRange } from "@/hooks/useEvents";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { TaskCard } from "@/components/tasks/TaskCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils/cn";
import { endOfDayTs, format, formatDateBR, formatWeekLabel, startOfDayTs, toWeekKey } from "@/lib/utils/date";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.FC<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-4", accent && "border-primary/30 bg-primary/5")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={cn("p-2 rounded-lg shrink-0", accent ? "bg-primary/20" : "bg-secondary")}>
          <Icon className={cn("h-4 w-4", accent ? "text-primary" : "text-muted-foreground")} />
        </div>
      </div>
    </div>
  );
}

function EventCard({
  title,
  timeLabel,
  location,
}: {
  title: string;
  timeLabel: string;
  location?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {timeLabel}
            </span>
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {location}
              </span>
            )}
          </div>
        </div>
        <Calendar className="h-4 w-4 shrink-0 text-primary" />
      </div>
    </div>
  );
}

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { tasks: todayTasks, loading } = useTodayTasks();
  const { tasks: weeklyTasks } = useWeeklyTasks();
  const { log } = useDailyLog();
  const { goals } = useWeeklyGoals();
  const { openQuickTask, openNewEvent } = useUIStore();

  const today = new Date();
  const { events: todayEvents, loading: eventsLoading } = useEventsInRange(startOfDayTs(today), endOfDayTs(today));
  const firstName = user?.displayName?.split(" ")[0] ?? "voce";
  const todayDone = todayTasks.filter((task) => task.status === "done").length;
  const todayPending = todayTasks.filter((task) => task.status !== "done");
  const sortedTodayEvents = [...todayEvents].sort((a, b) => a.startAt - b.startAt);
  const weekDone = weeklyTasks.filter((task) => task.status === "done").length;
  const weekTotal = weeklyTasks.length;
  const weekProgress = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;
  const goalsDone = goals.filter((goal) => goal.status === "done").length;
  const hour = today.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground">{greeting}, {firstName}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDateBR(today)} · {formatWeekLabel(toWeekKey(today))}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openQuickTask}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova tarefa
          </button>

          <button
            onClick={() => openNewEvent()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-border hover:bg-accent transition-colors"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Novo agendamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Hoje" value={todayTasks.length} sub={`${todayDone} concluidas`} icon={CheckCircle2} accent />
        <StatCard label="Pendentes" value={todayPending.length} sub="para hoje" icon={Circle} />
        <StatCard label="Esta semana" value={`${weekProgress}%`} sub={`${weekDone}/${weekTotal} tarefas`} icon={TrendingUp} />
        <StatCard label="Metas" value={`${goalsDone}/${goals.length}`} sub="esta semana" icon={Calendar} />
      </div>

      {weekTotal > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-foreground">Progresso semanal</span>
            <Link to="/week" className="text-xs text-primary hover:underline">
              Ver semana →
            </Link>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", weekProgress === 100 ? "bg-green-500" : "bg-primary")}
              style={{ width: `${weekProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{weekDone} de {weekTotal} tarefas concluidas</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tarefas de hoje</h2>
          <Link to="/today" className="text-xs text-primary hover:underline">
            Ver todas →
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : todayPending.length === 0 ? (
          <EmptyState
            title="Dia livre"
            description="Todas as tarefas de hoje foram concluidas."
            action={
              <button onClick={openQuickTask} className="text-xs text-primary hover:underline">
                + Adicionar tarefa
              </button>
            }
          />
        ) : (
          <div className="space-y-2">
            {todayPending.slice(0, 4).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {todayPending.length > 4 && (
              <Link to="/today" className="block text-center text-xs text-muted-foreground hover:text-primary py-2">
                +{todayPending.length - 4} mais tarefa(s)
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agendamentos de hoje</h2>
          <Link to="/calendar" className="text-xs text-primary hover:underline">
            Ver agenda â†’
          </Link>
        </div>

        {eventsLoading ? (
          <LoadingSpinner />
        ) : sortedTodayEvents.length === 0 ? (
          <EmptyState
            title="Sem agendamentos"
            description="Nenhum agendamento para hoje."
            action={
              <button onClick={() => openNewEvent()} className="text-xs text-primary hover:underline">
                + Adicionar agendamento
              </button>
            }
          />
        ) : (
          <div className="space-y-2">
            {sortedTodayEvents.slice(0, 4).map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                timeLabel={event.allDay ? "Dia todo" : `${format(event.startAt, "HH:mm")} - ${format(event.endAt, "HH:mm")}`}
                location={event.location}
              />
            ))}
            {sortedTodayEvents.length > 4 && (
              <Link to="/calendar" className="block text-center text-xs text-muted-foreground hover:text-primary py-2">
                +{sortedTodayEvents.length - 4} mais agendamento(s)
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diario da gratidao</h2>
          <Link to="/journal" className="text-xs text-primary hover:underline">
            Ver historico →
          </Link>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 min-h-[90px]">
          {log ? (
            <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">{log.content}</p>
          ) : (
            <div className="flex flex-col items-center justify-center h-16 text-center">
              <Pencil className="h-5 w-5 text-muted-foreground/20 mb-1.5" />
              <Link to="/today" className="text-xs text-muted-foreground hover:text-primary">
                Escrever registro de hoje
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

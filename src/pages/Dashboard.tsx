/**
 * pages/Dashboard.tsx
 *
 * Visão consolidada: resumo do dia, próximos eventos, progresso da semana.
 */

import { CheckCircle2, Circle, TrendingUp, Calendar, Pencil } from "lucide-react";
import { useTodayTasks, useWeeklyTasks } from "@/hooks/useTasks";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { TaskCard } from "@/components/tasks/TaskCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatDateBR, toDateKey, toWeekKey, formatWeekLabel } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { Link } from "react-router-dom";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  className,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.FC<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-4", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { tasks: todayTasks, loading: tasksLoading } = useTodayTasks();
  const { tasks: weeklyTasks } = useWeeklyTasks();
  const { log } = useDailyLog();
  const { goals } = useWeeklyGoals();
  const { openQuickTask } = useUIStore();

  const today = new Date();
  const weekKey = toWeekKey(today);

  const doneTasks = todayTasks.filter((t) => t.status === "done");
  const pendingTasks = todayTasks.filter((t) => t.status !== "done").slice(0, 5);

  const weekDone = weeklyTasks.filter((t) => t.status === "done").length;
  const weekTotal = weeklyTasks.length;
  const weekProgress = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;

  const goalsDone = goals.filter((g) => g.status === "done").length;

  const greeting = "Olá";
  const firstName = user?.displayName?.split(" ")[0] ?? "você";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Saudação */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {formatDateBR(today)} · {formatWeekLabel(weekKey)}
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Tarefas hoje"
          value={todayTasks.length}
          sub={`${doneTasks.length} concluídas`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Pendentes"
          value={todayTasks.filter((t) => t.status !== "done").length}
          sub="para hoje"
          icon={Circle}
        />
        <StatCard
          label="Progresso semanal"
          value={`${weekProgress}%`}
          sub={`${weekDone}/${weekTotal} tarefas`}
          icon={TrendingUp}
        />
        <StatCard
          label="Metas da semana"
          value={`${goalsDone}/${goals.length}`}
          sub="concluídas"
          icon={Calendar}
        />
      </div>

      {/* Layout duas colunas */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tarefas pendentes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Tarefas de hoje</h2>
            <Link
              to="/today"
              className="text-xs text-primary hover:underline"
            >
              Ver todas
            </Link>
          </div>

          {tasksLoading ? (
            <LoadingSpinner />
          ) : pendingTasks.length === 0 ? (
            <EmptyState
              title="Sem tarefas pendentes"
              description="Todas as tarefas de hoje foram concluídas."
              action={
                <button
                  onClick={openQuickTask}
                  className="text-xs text-primary hover:underline"
                >
                  + Adicionar tarefa
                </button>
              }
            />
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Resumo do dia */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">O que fiz hoje</h2>
            <Link to="/today" className="text-xs text-primary hover:underline">
              Editar
            </Link>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 min-h-[120px]">
            {log ? (
              <div>
                <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-6">
                  {log.content}
                </p>
                {log.mood && (
                  <div className="mt-3 flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Humor:</span>
                    <span className="text-xs font-medium capitalize text-foreground">{log.mood}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-center">
                <Pencil className="h-6 w-6 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Nenhum registro hoje.{" "}
                  <Link to="/today" className="text-primary hover:underline">
                    Registrar agora
                  </Link>
                </p>
              </div>
            )}
          </div>

          {/* Progresso semanal */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-foreground">Progresso semanal</span>
              <span className="text-xs text-muted-foreground">{weekProgress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${weekProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {weekDone} de {weekTotal} tarefas concluídas esta semana
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

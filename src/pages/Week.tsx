/**
 * pages/Week.tsx — com abas de categoria e metas semanais
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Target, Plus, Trash2 } from "lucide-react";
import { addDays, subDays, startOfWeek, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useWeeklyTasks, useCreateTask } from "@/hooks/useTasks";
import { useWeeklyGoals, useCreateWeeklyGoal, useDeleteWeeklyGoal, useUpdateGoalProgress } from "@/hooks/useWeeklyGoals";
import { useCategories } from "@/hooks/useCategories";
import { TaskCard } from "@/components/tasks/TaskCard";
import { CategoryTabs } from "@/components/shared/CategoryTabs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toDateKey, toWeekKey, formatWeekLabel } from "@/lib/utils/date";
import { weeklyGoalSchema, type WeeklyGoalInput } from "@/lib/validators/auth";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validators/task";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import type { WeeklyGoal, Task } from "@/types";

// ─── GoalItem ─────────────────────────────────────────────────────────────────

function GoalItem({ goal, weekKey }: { goal: WeeklyGoal; weekKey: string }) {
  const del = useDeleteWeeklyGoal(weekKey);
  const updateProgress = useUpdateGoalProgress(weekKey);
  const percent = goal.target > 0 ? Math.min(100, Math.round((goal.progress / goal.target) * 100)) : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-3 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{goal.title}</p>
          {goal.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{goal.description}</p>
          )}
        </div>
        <button
          onClick={() => del.mutate(goal.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{goal.progress} / {goal.target}</span>
          <span className="text-xs font-medium text-foreground">{percent}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", percent >= 100 ? "bg-green-500" : "bg-primary")}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <button
          onClick={() => updateProgress.mutate({ goalId: goal.id, progress: Math.max(0, goal.progress - 1) })}
          className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80"
        >−</button>
        <span className="text-xs text-muted-foreground px-1">{goal.progress}</span>
        <button
          onClick={() => updateProgress.mutate({ goalId: goal.id, progress: goal.progress + 1 })}
          className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80"
        >+</button>
      </div>
    </div>
  );
}

// ─── AddGoalForm ──────────────────────────────────────────────────────────────

function AddGoalForm({ weekKey }: { weekKey: string }) {
  const [open, setOpen] = useState(false);
  const createGoal = useCreateWeeklyGoal(weekKey);
  const { register, handleSubmit, reset } = useForm<WeeklyGoalInput>({
    resolver: zodResolver(weeklyGoalSchema),
    defaultValues: { target: 1 },
  });

  async function onSubmit(data: WeeklyGoalInput) {
    try {
      await createGoal.mutateAsync(data);
      toast.success("Meta criada");
      reset({ target: 1 });
      setOpen(false);
    } catch { toast.error("Erro ao criar meta"); }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-xs text-primary hover:underline">
      <Plus className="h-3.5 w-3.5" />Adicionar meta
    </button>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="border border-primary/40 rounded-lg p-3 space-y-2 bg-card">
      <input {...register("title")} placeholder="Meta da semana..." autoFocus
        className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
      <div className="flex gap-2">
        <input type="number" {...register("target", { valueAsNumber: true })} placeholder="Meta" min={1}
          className="w-20 bg-background border border-border rounded px-2 py-1.5 text-sm focus:outline-none" />
        <button type="submit" disabled={createGoal.isPending}
          className="px-3 py-1.5 text-xs font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          Salvar
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-xs rounded hover:bg-accent text-muted-foreground">
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function Week() {
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const { tasks, loading, weekKey } = useWeeklyTasks(referenceDate);
  const { goals } = useWeeklyGoals(referenceDate);
  const { categories } = useCategories();

  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filtra tasks pela categoria ativa
  const filteredTasks = activeCategoryId
    ? tasks.filter((t) => t.categoryId === activeCategoryId)
    : tasks;

  function tasksByDay(dayDate: Date): Task[] {
    const key = toDateKey(dayDate);
    return filteredTasks.filter((t) => t.date === key || (!t.date && t.isWeekly));
  }

  const doneTasks = tasks.filter((t) => t.status === "done");
  const weekProgress = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  // Contagens por categoria
  const counts: Record<string, number> = {};
  categories.forEach((cat) => {
    counts[cat.id] = tasks.filter((t) => t.categoryId === cat.id).length;
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Semana</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{formatWeekLabel(weekKey)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setReferenceDate((d) => subDays(d, 7))} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setReferenceDate(new Date())} className="px-3 py-1.5 text-xs rounded-lg hover:bg-accent text-muted-foreground">
            Hoje
          </button>
          <button onClick={() => setReferenceDate((d) => addDays(d, 7))} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progresso geral */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progresso semanal</span>
          <span className="text-sm text-muted-foreground">{doneTasks.length}/{tasks.length} · {weekProgress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${weekProgress}%` }} />
        </div>
      </div>

      {/* Abas de categoria */}
      {categories.length > 0 && (
        <CategoryTabs
          categories={categories}
          activeId={activeCategoryId}
          onChange={setActiveCategoryId}
          counts={counts}
        />
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Metas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Metas da semana</h2>
          </div>
          <div className="space-y-2">
            {goals.map((goal) => <GoalItem key={goal.id} goal={goal} weekKey={weekKey} />)}
            <AddGoalForm weekKey={weekKey} />
          </div>
        </div>

        {/* Tarefas por dia */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Tarefas por dia</h2>

          {loading ? <LoadingSpinner /> : (
            <div className="space-y-4">
              {weekDays.map((day) => {
                const dayTasks = tasksByDay(day);
                const isToday = toDateKey(day) === toDateKey(new Date());
                const label = format(day, "EEE, d MMM", { locale: ptBR });

                return (
                  <div key={toDateKey(day)}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn("text-xs font-semibold capitalize", isToday ? "text-primary" : "text-muted-foreground")}>
                        {label}
                      </span>
                      {isToday && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">hoje</span>}
                      <span className="text-xs text-muted-foreground/60">{dayTasks.length} tarefa{dayTasks.length !== 1 ? "s" : ""}</span>
                    </div>

                    {dayTasks.length > 0 ? (
                      <div className="space-y-2">
                        {dayTasks.map((task: Task) => <TaskCard key={task.id} task={task} />)}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground/40 italic py-1 pl-1">Nenhuma tarefa</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

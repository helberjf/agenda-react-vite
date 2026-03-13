/**
 * pages/Today.tsx
 *
 * Foco total no dia: tarefas, log e progresso.
 * Baixa fricção — campo de log sempre visível.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Circle, Plus, Smile } from "lucide-react";
import { useTodayTasks, useCreateTask } from "@/hooks/useTasks";
import { useDailyLog, useUpsertDailyLog } from "@/hooks/useDailyLog";
import { TaskCard } from "@/components/tasks/TaskCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatDateBR, toDateKey, toWeekKey } from "@/lib/utils/date";
import { dailyLogSchema, type DailyLogInput } from "@/lib/validators/auth";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validators/task";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

const MOODS = [
  { value: "great", emoji: "😄", label: "Ótimo" },
  { value: "good", emoji: "🙂", label: "Bem" },
  { value: "neutral", emoji: "😐", label: "Ok" },
  { value: "bad", emoji: "😕", label: "Ruim" },
  { value: "terrible", emoji: "😞", label: "Péssimo" },
] as const;

function QuickAddTask({ date, weekKey }: { date: string; weekKey: string }) {
  const [open, setOpen] = useState(false);
  const createTask = useCreateTask();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { priority: "medium", isDaily: true, isWeekly: false, date, weekKey },
  });

  async function onSubmit(data: CreateTaskInput) {
    try {
      await createTask.mutateAsync(data);
      toast.success("Tarefa criada");
      reset({ priority: "medium", isDaily: true, isWeekly: false, date, weekKey });
      setOpen(false);
    } catch {
      toast.error("Erro ao criar tarefa");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-muted-foreground border border-dashed border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="h-4 w-4" />
        Adicionar tarefa
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="border border-primary/50 rounded-lg p-3 space-y-2 bg-card">
      <input
        {...register("title")}
        placeholder="Título da tarefa..."
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        autoFocus
      />
      {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}

      <div className="flex items-center gap-2">
        <select
          {...register("priority")}
          className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none"
        >
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>

        <button
          type="submit"
          disabled={createTask.isPending}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Salvar
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

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<DailyLogInput>({
    resolver: zodResolver(dailyLogSchema),
    values: { content: log?.content ?? "", mood: log?.mood },
  });

  async function onSubmit(data: DailyLogInput) {
    try {
      await upsert.mutateAsync({ dateKey, input: { ...data, mood: selectedMood } });
      toast.success("Registro salvo");
    } catch {
      toast.error("Erro ao salvar");
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <textarea
        {...register("content")}
        placeholder="O que você fez hoje? O que aprendeu? Como foi o dia?&#10;&#10;Escreva livremente — este é seu diário de produtividade."
        rows={6}
        className={cn(
          "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm",
          "placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50",
          "resize-none leading-relaxed",
          errors.content && "border-destructive"
        )}
      />
      {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Smile className="h-4 w-4 text-muted-foreground mr-1" />
          {MOODS.map((mood) => (
            <button
              key={mood.value}
              type="button"
              onClick={() => setSelectedMood(mood.value)}
              title={mood.label}
              className={cn(
                "text-lg p-1 rounded-lg transition-all",
                selectedMood === mood.value
                  ? "bg-primary/10 scale-110"
                  : "opacity-50 hover:opacity-100"
              )}
            >
              {mood.emoji}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={upsert.isPending}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {upsert.isPending ? "Salvando..." : log ? "Atualizar" : "Salvar registro"}
        </button>
      </div>
    </form>
  );
}

export function Today() {
  const today = new Date();
  const dateKey = toDateKey(today);
  const weekKey = toWeekKey(today);

  const { tasks, loading } = useTodayTasks(today);

  const doneTasks = tasks.filter((t) => t.status === "done");
  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const progress = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Hoje</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{formatDateBR(today)}</p>
      </div>

      {/* Progresso */}
      {tasks.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">
              {doneTasks.length} de {tasks.length} concluídas
            </span>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Tarefas pendentes */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Circle className="h-4 w-4 text-muted-foreground" />
          Pendentes ({pendingTasks.length})
        </h2>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            <QuickAddTask date={dateKey} weekKey={weekKey} />
          </div>
        )}
      </section>

      {/* Tarefas concluídas */}
      {doneTasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Concluídas ({doneTasks.length})
          </h2>
          <div className="space-y-2">
            {doneTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Log do dia */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">O que fiz hoje</h2>
        <DailyLogSection dateKey={dateKey} date={today} />
      </section>
    </div>
  );
}

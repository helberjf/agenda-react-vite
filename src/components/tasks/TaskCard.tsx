import { CheckCircle2, Circle, Trash2, Calendar } from "lucide-react";
import { format, isPast, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils/cn";
import { useCompleteTask, useUncompleteTask, useDeleteTask } from "@/hooks/useTasks";
import { useCategories } from "@/hooks/useCategories";
import type { Task } from "@/types";

const PRIORITY = {
  urgent: { label: "Urgente", border: "border-l-red-500", badge: "bg-red-500/15 text-red-400", dot: "bg-red-500" },
  high: { label: "Alta", border: "border-l-orange-500", badge: "bg-orange-500/15 text-orange-400", dot: "bg-orange-500" },
  medium: { label: "Media", border: "border-l-blue-500", badge: "bg-blue-500/15 text-blue-400", dot: "bg-blue-500" },
  low: { label: "Baixa", border: "border-l-slate-500", badge: "bg-slate-500/10 text-slate-400", dot: "bg-slate-500" },
} as const;

function formatShortDate(dateKey: string): string {
  try {
    return format(parseISO(dateKey), "dd MMM", { locale: ptBR });
  } catch {
    return dateKey;
  }
}

function taskDateLabel(dateKey: string): string {
  try {
    const date = parseISO(dateKey);
    if (isToday(date)) return "";
    if (isTomorrow(date)) return "Amanha";
    return formatShortDate(dateKey);
  } catch {
    return "";
  }
}

function deadlineLabel(dateKey: string): string {
  try {
    const date = parseISO(dateKey);
    if (isToday(date)) return "Prazo hoje";
    if (isTomorrow(date)) return "Prazo amanha";
    return `Prazo ${formatShortDate(dateKey)}`;
  } catch {
    return "Prazo definido";
  }
}

function isDateOverdue(dateKey?: string) {
  if (!dateKey) return false;

  try {
    return isPast(parseISO(`${dateKey}T23:59:59`));
  } catch {
    return false;
  }
}

export function TaskCard({ task, showDate = false }: { task: Task; showDate?: boolean }) {
  const complete = useCompleteTask();
  const uncomplete = useUncompleteTask();
  const del = useDeleteTask();
  const { categories } = useCategories();

  const isDone = task.status === "done";
  const priority = PRIORITY[task.priority];
  const category = categories.find((item) => item.id === task.categoryId);
  const plannedDateLabel = showDate ? taskDateLabel(task.date) : "";
  const deadlineText = task.deadline ? deadlineLabel(task.deadline) : "";
  const overdueBase = task.deadline ?? task.date;
  const isOverdue = !isDone && isDateOverdue(overdueBase);

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border border-border border-l-2 bg-card py-3 pl-3 pr-4 transition-all hover:border-border/60 hover:bg-accent/20",
        priority.border,
        isDone && "opacity-50"
      )}
    >
      <button
        onClick={() => (isDone ? uncomplete.mutate(task.id) : complete.mutate(task.id))}
        disabled={complete.isPending || uncomplete.isPending}
        className={cn(
          "mt-0.5 shrink-0 transition-colors",
          isDone ? "text-primary" : "text-muted-foreground hover:text-primary"
        )}
      >
        {isDone ? <CheckCircle2 className="h-[18px] w-[18px]" /> : <Circle className="h-[18px] w-[18px]" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium leading-snug", isDone ? "line-through text-muted-foreground" : "text-foreground")}>
          {task.title}
        </p>

        {task.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", priority.badge)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
            {priority.label}
          </span>

          {category && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${category.color}25`, color: category.color }}
            >
              {category.name}
            </span>
          )}

          {deadlineText && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px]",
                isOverdue ? "text-red-400" : "text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              {isOverdue ? `Atrasada - ${deadlineText}` : deadlineText}
            </span>
          )}

          {plannedDateLabel && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {plannedDateLabel}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => del.mutate(task)}
        disabled={del.isPending}
        className="mt-0.5 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

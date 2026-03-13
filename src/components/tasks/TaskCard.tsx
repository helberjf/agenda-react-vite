import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCompleteTask, useUncompleteTask, useDeleteTask } from "@/hooks/useTasks";
import { useCategories } from "@/hooks/useCategories";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import type { Task } from "@/types";

const PRIORITY_CONFIG = {
  urgent: { label: "Urgente", className: "text-red-500", dot: "bg-red-500" },
  high: { label: "Alta", className: "text-orange-500", dot: "bg-orange-500" },
  medium: { label: "Média", className: "text-yellow-500", dot: "bg-yellow-500" },
  low: { label: "Baixa", className: "text-muted-foreground", dot: "bg-muted-foreground/40" },
};

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const complete = useCompleteTask();
  const uncomplete = useUncompleteTask();
  const del = useDeleteTask();
  const { categories } = useCategories();

  const isDone = task.status === "done";
  const priority = PRIORITY_CONFIG[task.priority];
  const category = categories.find((c) => c.id === task.categoryId);

  function toggleComplete() {
    if (isDone) uncomplete.mutate(task.id);
    else complete.mutate(task.id);
  }

  return (
    <div className={cn(
      "group flex items-start gap-3 px-4 py-3 rounded-lg border border-border bg-card",
      "hover:border-border/80 transition-all",
      isDone && "opacity-60"
    )}>
      <button
        onClick={toggleComplete}
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
        disabled={complete.isPending || uncomplete.isPending}
      >
        {isDone
          ? <CheckCircle2 className="h-4 w-4 text-primary" />
          : <Circle className="h-4 w-4" />
        }
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium text-foreground leading-snug",
          isDone && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>

        {task.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className={cn("flex items-center gap-1 text-xs", priority.className)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
            {priority.label}
          </span>
          {category && <CategoryBadge category={category} />}
        </div>
      </div>

      <button
        onClick={() => del.mutate(task)}
        className="opacity-0 group-hover:opacity-100 mt-0.5 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
        disabled={del.isPending}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

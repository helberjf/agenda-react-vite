import { useState } from "react";
import { subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useTasksByDate } from "@/hooks/useTasks";
import { useDailyLog } from "@/hooks/useDailyLog";
import { TaskCard } from "@/components/tasks/TaskCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { toDateKey, formatDateBR } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

function DayView({ date }: { date: Date }) {
  const dateKey = toDateKey(date);
  const { data: tasks = [], isLoading: tasksLoading } = useTasksByDate(dateKey);
  const { log, loading: logLoading } = useDailyLog(date);

  const done = tasks.filter((t) => t.status === "done");
  const pending = tasks.filter((t) => t.status !== "done");

  if (tasksLoading || logLoading) return <LoadingSpinner />;

  const isEmpty = tasks.length === 0 && !log;

  if (isEmpty) {
    return (
      <EmptyState
        icon={<Calendar className="h-8 w-8" />}
        title="Nenhum registro neste dia"
        description="Não há tarefas nem logs para esta data."
      />
    );
  }

  return (
    <div className="space-y-4">
      {log && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Registro do dia
          </h3>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {log.content}
          </p>
          {log.mood && (
            <p className="mt-2 text-xs text-muted-foreground">
              Humor: <span className="capitalize">{log.mood}</span>
            </p>
          )}
        </div>
      )}

      {done.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Concluídas ({done.length})
          </h3>
          <div className="space-y-2">
            {done.map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Não concluídas ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export function History() {
  const [selectedDate, setSelectedDate] = useState<Date>(subDays(new Date(), 1));

  // Últimos 14 dias para navegação rápida
  const recentDays = Array.from({ length: 14 }, (_, i) => subDays(new Date(), i + 1));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Histórico</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Registros e tarefas de dias anteriores
        </p>
      </div>

      {/* Seletor de data */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate((d) => subDays(d, 1))}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex-1 text-center">
            <p className="text-sm font-medium text-foreground">{formatDateBR(selectedDate)}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {format(selectedDate, "EEEE", { locale: ptBR })}
            </p>
          </div>

          <button
            onClick={() => {
              const next = new Date(selectedDate);
              next.setDate(next.getDate() + 1);
              if (next < new Date()) setSelectedDate(next);
            }}
            disabled={toDateKey(selectedDate) >= toDateKey(subDays(new Date(), 1))}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Acesso rápido */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {recentDays.map((day) => {
            const isSelected = toDateKey(day) === toDateKey(selectedDate);
            return (
              <button
                key={toDateKey(day)}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "shrink-0 flex flex-col items-center px-3 py-2 rounded-lg text-xs transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                <span className="capitalize">{format(day, "EEE", { locale: ptBR })}</span>
                <span className="font-medium">{format(day, "d")}</span>
              </button>
            );
          })}
        </div>

        {/* Input manual de data */}
        <input
          type="date"
          value={toDateKey(selectedDate)}
          max={toDateKey(subDays(new Date(), 1))}
          onChange={(e) => e.target.value && setSelectedDate(new Date(e.target.value + "T12:00:00"))}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="border-t border-border" />

      <DayView date={selectedDate} />
    </div>
  );
}

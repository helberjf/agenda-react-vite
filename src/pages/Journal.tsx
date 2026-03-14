import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BookOpen, CalendarDays } from "lucide-react";
import { useDailyLog, useDailyLogs } from "@/hooks/useDailyLog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils/cn";
import { formatDateBR, toDateKey } from "@/lib/utils/date";
import type { DailyLog } from "@/types";

type JournalView = "day" | "month" | "list";

const JOURNAL_VIEWS: { key: JournalView; label: string }[] = [
  { key: "day", label: "Dia" },
  { key: "month", label: "Mes" },
  { key: "list", label: "Lista" },
];

function JournalCard({ log }: { log: DailyLog }) {
  return (
    <article className="bg-card border border-border rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{formatDateBR(new Date(`${log.date}T12:00:00`))}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {format(new Date(`${log.date}T12:00:00`), "EEEE", { locale: ptBR })}
          </p>
        </div>
        {log.mood && (
          <span className="px-2 py-1 text-[10px] rounded-full bg-secondary text-muted-foreground capitalize">
            {log.mood}
          </span>
        )}
      </div>

      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{log.content}</p>
    </article>
  );
}

export function Journal() {
  const [view, setView] = useState<JournalView>("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  const { log, loading: dayLoading } = useDailyLog(selectedDate);
  const { logs: monthLogs, loading: monthLoading } = useDailyLogs(selectedMonth);
  const { logs: allLogs, loading: listLoading } = useDailyLogs();

  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split("-");
    return format(new Date(Number(year), Number(month) - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });
  }, [selectedMonth]);

  const maxDate = toDateKey(new Date());

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Diario da gratidao</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Acesse o historico dos seus registros por dia, mes ou em lista.
        </p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {JOURNAL_VIEWS.map((item) => (
          <button
            key={item.key}
            onClick={() => setView(item.key)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full transition-colors",
              view === item.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {view === "day" && (
        <section className="space-y-4">
          <input
            type="date"
            value={toDateKey(selectedDate)}
            max={maxDate}
            onChange={(event) => setSelectedDate(new Date(`${event.target.value}T12:00:00`))}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          {dayLoading ? (
            <LoadingSpinner />
          ) : log ? (
            <JournalCard log={log} />
          ) : (
            <EmptyState
              icon={<BookOpen className="h-8 w-8" />}
              title="Sem registro neste dia"
              description="Nao ha anotacoes salvas para a data selecionada."
            />
          )}
        </section>
      )}

      {view === "month" && (
        <section className="space-y-4">
          <input
            type="month"
            value={selectedMonth}
            max={format(new Date(), "yyyy-MM")}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          <div>
            <p className="text-sm font-medium text-foreground capitalize">{monthLabel}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{monthLogs.length} registro(s)</p>
          </div>

          {monthLoading ? (
            <LoadingSpinner />
          ) : monthLogs.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-8 w-8" />}
              title="Sem registros neste mes"
              description="Quando voce salvar novas entradas, elas aparecerao aqui."
            />
          ) : (
            <div className="space-y-3">
              {monthLogs.map((item) => (
                <JournalCard key={item.date} log={item} />
              ))}
            </div>
          )}
        </section>
      )}

      {view === "list" && (
        <section className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground">Todos os registros</p>
            <p className="text-xs text-muted-foreground mt-0.5">{allLogs.length} registro(s) encontrados</p>
          </div>

          {listLoading ? (
            <LoadingSpinner />
          ) : allLogs.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-8 w-8" />}
              title="Seu diario ainda esta vazio"
              description="Escreva um registro no dia para montar seu historico."
            />
          ) : (
            <div className="space-y-3">
              {allLogs.map((item) => (
                <JournalCard key={item.date} log={item} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

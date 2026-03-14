import { cn } from "@/lib/utils/cn";

export type AgendaTypeFilterValue = "all" | "tasks" | "events";

interface AgendaTypeFilterProps {
  value: AgendaTypeFilterValue;
  onChange: (value: AgendaTypeFilterValue) => void;
  counts: Record<AgendaTypeFilterValue, number>;
}

const LABELS: Record<AgendaTypeFilterValue, string> = {
  all: "Tudo",
  tasks: "Tarefas",
  events: "Agendamentos",
};

export function AgendaTypeFilter({ value, onChange, counts }: AgendaTypeFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(["all", "tasks", "events"] as AgendaTypeFilterValue[]).map((item) => (
        <button
          key={item}
          onClick={() => onChange(item)}
          className={cn(
            "px-2.5 py-1 text-xs rounded-full transition-colors",
            value === item
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          {LABELS[item]} ({counts[item]})
        </button>
      ))}
    </div>
  );
}

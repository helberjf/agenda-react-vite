import { CalendarRange, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCategories } from "@/hooks/useCategories";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import type { CalendarEvent } from "@/types";

function formatEventTime(event: CalendarEvent) {
  if (event.allDay) return "Dia inteiro";
  return `${format(new Date(event.startAt), "HH:mm", { locale: ptBR })} - ${format(new Date(event.endAt), "HH:mm", { locale: ptBR })}`;
}

export function EventCard({ event, showDate = false }: { event: CalendarEvent; showDate?: boolean }) {
  const { categories } = useCategories();
  const category = categories.find((item) => item.id === event.categoryId);

  return (
    <div className="flex items-start gap-3 pl-3 pr-4 py-3 rounded-lg border border-border border-l-2 border-l-emerald-500 bg-card">
      <div className="mt-0.5 shrink-0 text-emerald-500">
        <CalendarRange className="h-[18px] w-[18px]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug text-foreground">{event.title}</p>

        {event.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{event.description}</p>
        )}

        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
            <Clock className="h-3 w-3" />
            {formatEventTime(event)}
          </span>

          {showDate && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <CalendarRange className="h-3 w-3" />
              {format(new Date(event.startAt), "dd MMM", { locale: ptBR })}
            </span>
          )}

          <CategoryBadge category={category} />

          {event.location && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

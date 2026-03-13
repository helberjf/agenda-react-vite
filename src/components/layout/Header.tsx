import { Menu, Plus, CalendarPlus } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Header() {
  const { toggleSidebar, openQuickTask, openNewEvent } = useUIStore();
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 flex items-center px-4 gap-3">
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      <p className="text-sm text-muted-foreground capitalize hidden sm:block">{today}</p>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={openQuickTask}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Tarefa</span>
        </button>
        <button
          onClick={() => openNewEvent()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <CalendarPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Evento</span>
        </button>
      </div>
    </header>
  );
}

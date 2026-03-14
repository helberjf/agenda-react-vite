import { NavLink } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Calendar, Clock, Plus } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils/cn";

const ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { to: "/today", icon: Clock, label: "Hoje" },
  { to: "/week", icon: CalendarDays, label: "Semana" },
  { to: "/calendar", icon: Calendar, label: "Agenda" },
];

export function BottomNav() {
  const { openQuickTask } = useUIStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center px-2 pb-safe">
      {ITEMS.slice(0, 2).map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => cn(
            "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}

      {/* Botão central de nova tarefa */}
      <div className="flex-1 flex justify-center py-1.5">
        <button
          onClick={openQuickTask}
          className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {ITEMS.slice(2).map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => cn(
            "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

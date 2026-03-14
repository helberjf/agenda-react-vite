import { NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  CalendarDays,
  Clock,
  History,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Tag,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { to: "/today", icon: Clock, label: "Hoje" },
  { to: "/week", icon: CalendarDays, label: "Semana" },
  { to: "/calendar", icon: Calendar, label: "Agenda" },
  { to: "/journal", icon: BookOpen, label: "Diario" },
  { to: "/history", icon: History, label: "Historico" },
  { to: "/categories", icon: Tag, label: "Categorias" },
  { to: "/settings", icon: Settings, label: "Config." },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const { openQuickTask } = useUIStore();
  const navigate = useNavigate();

  async function handleSignOut() {
    await logout();
    navigate("/login");
  }

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-card h-screen">
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <CalendarDays className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-foreground tracking-tight">Agenda</span>
        </div>
      </div>

      <div className="px-3 py-3">
        <button
          onClick={openQuickTask}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova tarefa
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">
              {user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user?.displayName ?? user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

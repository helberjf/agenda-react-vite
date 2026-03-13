import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Sun, CalendarDays, Calendar, History,
  Settings, ChevronRight, Plus, LogOut,
} from "lucide-react";
import { mainNav, type NavItem } from "@/config/sidebar.config";
import { useUIStore } from "@/store/ui.store";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils/cn";

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  "layout-dashboard": LayoutDashboard,
  "sun": Sun,
  "calendar-days": CalendarDays,
  "calendar": Calendar,
  "history": History,
  "settings": Settings,
};

function NavItemLink({ item }: { item: Extract<NavItem, { type?: "item" }> }) {
  const { closeSidebar } = useUIStore();
  const Icon = ICON_MAP[item.icon] ?? ChevronRight;

  return (
    <NavLink
      to={item.href}
      end={item.href === "/"}
      onClick={() => closeSidebar()}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground"
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
      {item.badge && (
        <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { sidebarOpen } = useUIStore();
  const { openQuickTask } = useUIStore();
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-60 bg-card border-r border-border",
        "flex flex-col transition-transform duration-200",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border shrink-0">
        <span className="font-semibold text-foreground tracking-tight">Agenda</span>
      </div>

      {/* Ação rápida */}
      <div className="px-3 pt-4">
        <button
          onClick={openQuickTask}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
            "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          )}
        >
          <Plus className="h-4 w-4" />
          Nova tarefa
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNav.map((item, i) => {
          if (item.type === "divider") {
            return <div key={i} className="my-2 border-t border-border" />;
          }
          if (item.type === "section") {
            return (
              <p key={i} className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
            );
          }
          return <NavItemLink key={item.href} item={item} />;
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary shrink-0">
            {user?.displayName?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {user?.displayName ?? "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

import { Bell, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

const TITLES: Record<string, string> = {
  "/": "Inicio",
  "/dashboard": "Inicio",
  "/today": "Hoje",
  "/week": "Semana",
  "/calendar": "Agenda",
  "/history": "Historico",
  "/journal": "Diario",
  "/categories": "Categorias",
  "/settings": "Configuracoes",
};

export function Header() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? "Agenda";

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
        <div className="md:hidden h-5 w-5 text-muted-foreground">
          <Menu className="h-5 w-5" />
        </div>
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-1">
        <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

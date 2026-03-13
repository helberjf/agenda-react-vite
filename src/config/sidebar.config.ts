/**
 * config/sidebar.config.ts
 *
 * Configuração declarativa da sidebar — mesmo padrão do projeto de referência.
 * Evita lógica de navegação espalhada por componentes.
 */

export type NavItem =
  | { type?: "item"; label: string; href: string; icon: string; badge?: string }
  | { type: "divider" }
  | { type: "section"; label: string };

export const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "layout-dashboard" },
  { label: "Hoje", href: "/today", icon: "sun" },
  { label: "Semana", href: "/week", icon: "calendar-days" },
  { label: "Calendário", href: "/calendar", icon: "calendar" },
  { type: "divider" },
  { label: "Histórico", href: "/history", icon: "history" },
  { type: "divider" },
  { label: "Configurações", href: "/settings", icon: "settings" },
];

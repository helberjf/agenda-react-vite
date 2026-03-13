/**
 * components/layout/AppLayout.tsx
 *
 * Layout raiz autenticado — sidebar + conteúdo.
 * Sidebar colapsa em mobile, fixa em desktop.
 */

import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useUIStore } from "@/store/ui.store";
import { QuickTaskModal } from "@/components/tasks/QuickTaskModal";
import { NewEventModal } from "@/components/events/NewEventModal";
import { cn } from "@/lib/utils/cn";

export function AppLayout() {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => useUIStore.getState().closeSidebar()}
        />
      )}

      <Sidebar />

      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-200",
          "lg:ml-60"
        )}
      >
        <Header />
        <main className="flex-1 p-4 md:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Modais globais */}
      <QuickTaskModal />
      <NewEventModal />
    </div>
  );
}

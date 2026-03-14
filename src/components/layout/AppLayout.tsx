import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { QuickTaskModal } from "@/components/tasks/QuickTaskModal";
import { NewEventModal } from "@/components/events/NewEventModal";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar — só desktop */}
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — só mobile */}
      <BottomNav />

      <QuickTaskModal />
      <NewEventModal />
    </div>
  );
}

/**
 * store/ui.store.ts
 *
 * Estado de UI global — sidebar, modais, preferências efêmeras.
 * Não persista aqui — use UserSettings no Firebase para preferências duráveis.
 */

import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;

  // Modal de criação rápida de tarefa
  quickTaskOpen: boolean;
  openQuickTask: () => void;
  closeQuickTask: () => void;

  // Modal de criação de evento
  newEventOpen: boolean;
  newEventDefaultDate: number | null;
  openNewEvent: (defaultDate?: number) => void;
  closeNewEvent: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),

  quickTaskOpen: false,
  openQuickTask: () => set({ quickTaskOpen: true }),
  closeQuickTask: () => set({ quickTaskOpen: false }),

  newEventOpen: false,
  newEventDefaultDate: null,
  openNewEvent: (defaultDate) =>
    set({ newEventOpen: true, newEventDefaultDate: defaultDate ?? null }),
  closeNewEvent: () => set({ newEventOpen: false, newEventDefaultDate: null }),
}));

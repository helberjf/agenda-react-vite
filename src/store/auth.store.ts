/**
 * store/auth.store.ts
 *
 * Estado global de autenticação com Zustand.
 * O Firebase Auth é a fonte de verdade — este store é apenas cache reativo.
 *
 * Não use este store para lógica de auth — use useAuth() hook.
 */

import { create } from "zustand";
import type { AuthUser } from "@/types";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setInitialized: () => set({ initialized: true, loading: false }),
}));

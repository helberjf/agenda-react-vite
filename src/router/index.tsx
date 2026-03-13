/**
 * router/index.tsx
 *
 * Configuração de rotas com React Router v7.
 * ProtectedRoute redireciona para /login se não autenticado.
 * Aguarda inicialização do Firebase Auth antes de decidir.
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageLoader } from "@/components/shared/LoadingSpinner";

// Pages — lazy loading para reduzir bundle inicial
import { Dashboard } from "@/pages/Dashboard";
import { Today } from "@/pages/Today";
import { Week } from "@/pages/Week";
import { CalendarPage } from "@/pages/CalendarPage";
import { History } from "@/pages/History";
import { Settings } from "@/pages/Settings";
import { Login } from "@/pages/auth/Login";
import { Register } from "@/pages/auth/Register";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();

  // Aguarda Firebase Auth inicializar antes de redirecionar
  if (!initialized) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();

  if (!initialized) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route
        path="/login"
        element={<PublicRoute><Login /></PublicRoute>}
      />
      <Route
        path="/register"
        element={<PublicRoute><Register /></PublicRoute>}
      />

      {/* Rotas protegidas */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="today" element={<Today />} />
        <Route path="week" element={<Week />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="history" element={<History />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

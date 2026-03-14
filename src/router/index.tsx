import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { Dashboard } from "@/pages/Dashboard";
import { Today } from "@/pages/Today";
import { Week } from "@/pages/Week";
import { CalendarPage } from "@/pages/CalendarPage";
import { History } from "@/pages/History";
import { Journal } from "@/pages/Journal";
import { Settings } from "@/pages/Settings";
import { Categories } from "@/pages/Categories";
import { Login } from "@/pages/auth/Login";
import { Register } from "@/pages/auth/Register";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();

  if (!initialized) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();

  if (!initialized) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="today" element={<Today />} />
        <Route path="week" element={<Week />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="history" element={<History />} />
        <Route path="journal" element={<Journal />} />
        <Route path="settings" element={<Settings />} />
        <Route path="categories" element={<Categories />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppRouter } from "@/router";
import { useAuthListener } from "@/hooks/useAuth";
import "@/styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2 * 60 * 1000, // 2 min
    },
  },
});

/** Componente raiz — inicializa Firebase Auth listener */
function Root() {
  useAuthListener();
  return <AppRouter />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Root />
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{ duration: 3000 }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

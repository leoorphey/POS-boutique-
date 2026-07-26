import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CategoriesPage } from "@/features/categories/CategoriesPage";
import { ProductsPage } from "@/features/products/ProductsPage";
import { UsersPage } from "@/features/users/UsersPage";
import { POSPage } from "@/features/pos/POSPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ExportPage } from "@/features/export/ExportPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import { useAuthStore } from "@/features/auth/auth.store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/admin/reset-password/:token" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute allowedRoles={["ADMIN", "VENDEUR"]} />}>
            <Route element={<AppLayout />}>
              <Route index element={<POSPage />} />
              <Route path="produits" element={<ProductsPage />} />

              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="utilisateurs" element={<UsersPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="export" element={<ExportPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/features/auth/auth.store";

interface ProtectedRouteProps {
  allowedRoles?: Array<"ADMIN" | "VENDEUR">;
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Si le store n'a pas encore lu localStorage, on attend plutôt que de
  // rediriger brutalement vers /login (évite le flash de déconnexion).
  if (!isHydrated) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

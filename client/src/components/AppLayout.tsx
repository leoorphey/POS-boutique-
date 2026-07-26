import { NavLink, Outlet } from "react-router-dom";
import { LayoutGrid, Package, ShoppingCart, Tags, BarChart3, Users, LogOut, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/auth.store";
import { useLogout } from "@/features/auth/auth.hooks";
import { Button } from "@/components/ui/button";

const navItems: Array<{ to: string; label: string; icon: typeof ShoppingCart; roles: Array<"ADMIN" | "VENDEUR"> }> = [
  { to: "/", label: "Caisse", icon: ShoppingCart, roles: ["ADMIN", "VENDEUR"] },
  { to: "/produits", label: "Produits", icon: Package, roles: ["ADMIN", "VENDEUR"] },
  { to: "/categories", label: "Catégories", icon: Tags, roles: ["ADMIN"] },
  { to: "/utilisateurs", label: "Vendeurs", icon: Users, roles: ["ADMIN"] },
  { to: "/dashboard", label: "Tableau de bord", icon: BarChart3, roles: ["ADMIN"] },
  { to: "/export", label: "Export", icon: Download, roles: ["ADMIN"] },
];

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const visibleItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-muted/30">
      <aside className="flex w-60 flex-col border-r bg-background">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <LayoutGrid className="h-5 w-5 text-primary" />
          <span className="font-semibold">POS Boutique</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium">{user?.nom}</p>
            <p className="text-xs text-muted-foreground">{user?.role === "ADMIN" ? "Administrateur" : "Vendeur"}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

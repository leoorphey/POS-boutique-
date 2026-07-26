import { useState } from "react";
import { Plus, Pencil, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUsers, useDeactivateUser } from "@/features/users/users.hooks";
import { AppUser } from "@/features/users/users.api";
import { UserFormDialog } from "@/features/users/UserFormDialog";

export function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const deactivateMutation = useDeactivateUser();

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  const openCreateForm = () => {
    setEditingUser(null);
    setFormOpen(true);
  };
  const openEditForm = (user: AppUser) => {
    setEditingUser(user);
    setFormOpen(true);
  };
  const handleDeactivate = (user: AppUser) => {
    if (window.confirm(`Désactiver le compte de "${user.nom}" ?`)) {
      deactivateMutation.mutate(user.id);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Vendeurs</h1>
          <p className="text-muted-foreground text-sm">
            Gérez les comptes administrateurs et vendeurs.
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          Nouveau vendeur
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}

      {users && (
        <div className="rounded-lg border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{user.nom}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.role === "ADMIN" ? "Administrateur" : "Vendeur"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        user.isActive
                          ? "text-green-600 text-xs font-medium"
                          : "text-muted-foreground text-xs"
                      }
                    >
                      {user.isActive ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditForm(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {user.isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeactivate(user)}
                        >
                          <UserX className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editingUser} />
    </div>
  );
}

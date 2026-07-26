import { useState } from "react";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCategories,
  useDeleteCategory,
} from "@/features/categories/categories.hooks";
import { Category } from "@/features/categories/categories.api";
import { CategoryFormDialog } from "@/features/categories/CategoryFormDialog";

export function CategoriesPage() {
  const { data: categories, isLoading, isError } = useCategories();
  const deleteMutation = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const openCreateForm = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const openEditForm = (category: Category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    const confirmed = window.confirm(
      `Supprimer la catégorie "${category.nom}" ? Cette action est irréversible.`
    );
    if (confirmed) {
      deleteMutation.mutate(category.id);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Catégories</h1>
          <p className="text-muted-foreground text-sm">
            Gérez les catégories de produits du catalogue.
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          Nouvelle catégorie
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Chargement des catégories...</p>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Impossible de charger les catégories. Vérifiez votre connexion.
        </p>
      )}

      {categories && categories.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Tags className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">Aucune catégorie pour le moment</p>
          <p className="text-sm text-muted-foreground mb-4">
            Créez votre première catégorie pour commencer à organiser le catalogue.
          </p>
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4" />
            Créer une catégorie
          </Button>
        </div>
      )}

      {categories && categories.length > 0 && (
        <div className="rounded-lg border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Produits</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{category.nom}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {category.description || "—"}
                  </td>
                  <td className="px-4 py-3">{category._count.products}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(category)}
                        aria-label={`Modifier ${category.nom}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category)}
                        aria-label={`Supprimer ${category.nom}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
      />
    </div>
  );
}

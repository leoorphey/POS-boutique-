import { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProducts, useDeleteProduct } from "@/features/products/products.hooks";
import { Product } from "@/features/products/products.api";
import { ProductFormDialog } from "@/features/products/ProductFormDialog";

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProducts({ search, page });
  const deleteMutation = useDeleteProduct();

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const openCreateForm = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };
  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };
  const handleDelete = (product: Product) => {
    if (window.confirm(`Retirer "${product.nom}" du catalogue ?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Produits</h1>
          <p className="text-muted-foreground text-sm">Gérez le catalogue de produits.</p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          Nouveau produit
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          className="pl-9"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}

      {data && (
        <div className="rounded-lg border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Prix vente</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {product.marque} {product.nom}
                    </p>
                    <p className="text-xs text-muted-foreground">{product.modele}</p>
                  </td>
                  <td className="px-4 py-3">{product.categorie.nom}</td>
                  <td className="px-4 py-3">
                    <span className={product.quantiteStock <= 5 ? "text-destructive" : ""}>
                      {product.quantiteStock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {Number(product.prixVente).toLocaleString("fr-FR")} FCFA
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditForm(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t text-sm">
              <span className="text-muted-foreground">
                Page {data.pagination.page} / {data.pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
      />
    </div>
  );
}

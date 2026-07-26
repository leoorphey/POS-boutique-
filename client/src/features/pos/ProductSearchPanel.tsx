import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/features/products/products.hooks";
import { useCartStore } from "@/features/pos/cart.store";

export function ProductSearchPanel() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useProducts({ search, limit: 20 });
  const addProduct = useCartStore((s) => s.addProduct);

  return (
    <div className="flex h-full flex-col">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Rechercher par nom, marque, modèle, IMEI ou numéro de série..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading && (
          <p className="text-sm text-muted-foreground text-center py-8">Recherche...</p>
        )}

        {!isLoading && data?.items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucun produit trouvé.
          </p>
        )}

        {data?.items.map((product) => (
          <button
            key={product.id}
            onClick={() => addProduct(product)}
            disabled={product.quantiteStock <= 0}
            className="w-full flex items-center justify-between rounded-lg border bg-background p-3 text-left hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <div>
              <p className="font-medium text-sm">
                {product.marque} {product.nom} {product.modele}
              </p>
              <p className="text-xs text-muted-foreground">
                {[product.ram, product.stockage, product.couleur].filter(Boolean).join(" · ")}
                {product.imei && ` · IMEI: ${product.imei}`}
              </p>
              <p className="text-xs mt-0.5">
                <span
                  className={
                    product.quantiteStock > 0 ? "text-green-600" : "text-destructive"
                  }
                >
                  Stock: {product.quantiteStock}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {Number(product.prixVente).toLocaleString("fr-FR")} FCFA
              </span>
              <Plus className="h-4 w-4 text-primary" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

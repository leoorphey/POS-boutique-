import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema, CreateProductInput } from "@pos/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Product } from "@/features/products/products.api";
import { useCreateProduct, useUpdateProduct } from "@/features/products/products.hooks";
import { useCategories } from "@/features/categories/categories.hooks";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const isEditMode = Boolean(product);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const { data: categories } = useCategories();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
  });

  useEffect(() => {
    if (open) {
      reset({
        nom: product?.nom ?? "",
        marque: product?.marque ?? "",
        modele: product?.modele ?? "",
        categorieId: product?.categorieId ?? "",
        ram: product?.ram ?? "",
        stockage: product?.stockage ?? "",
        couleur: product?.couleur ?? "",
        imei: product?.imei ?? "",
        numeroSerie: product?.numeroSerie ?? "",
        prixAchat: product ? Number(product.prixAchat) : undefined,
        prixVente: product ? Number(product.prixVente) : undefined,
        quantiteStock: product?.quantiteStock ?? 0,
        description: product?.description ?? "",
      });
    }
  }, [open, product, reset]);

  const onSubmit = async (values: CreateProductInput) => {
    if (isEditMode && product) {
      await updateMutation.mutateAsync({ id: product.id, input: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input {...register("nom")} placeholder="Ex: iPhone 15" />
              {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Marque</Label>
              <Input {...register("marque")} placeholder="Ex: Apple" />
              {errors.marque && (
                <p className="text-sm text-destructive">{errors.marque.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Modèle</Label>
              <Input {...register("modele")} placeholder="Ex: A2846" />
              {errors.modele && (
                <p className="text-sm text-destructive">{errors.modele.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <select
                {...register("categorieId")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Sélectionner...</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nom}
                  </option>
                ))}
              </select>
              {errors.categorieId && (
                <p className="text-sm text-destructive">{errors.categorieId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>RAM (optionnel)</Label>
              <Input {...register("ram")} placeholder="Ex: 8GB" />
            </div>
            <div className="space-y-2">
              <Label>Stockage (optionnel)</Label>
              <Input {...register("stockage")} placeholder="Ex: 256GB" />
            </div>
            <div className="space-y-2">
              <Label>Couleur (optionnel)</Label>
              <Input {...register("couleur")} placeholder="Ex: Noir" />
            </div>
            <div className="space-y-2">
              <Label>IMEI (optionnel)</Label>
              <Input {...register("imei")} />
            </div>
            <div className="space-y-2">
              <Label>Numéro de série (optionnel)</Label>
              <Input {...register("numeroSerie")} />
            </div>
            <div className="space-y-2">
              <Label>Quantité en stock</Label>
              <Input type="number" {...register("quantiteStock")} />
            </div>
            <div className="space-y-2">
              <Label>Prix d'achat (FCFA)</Label>
              <Input type="number" {...register("prixAchat")} />
              {errors.prixAchat && (
                <p className="text-sm text-destructive">{errors.prixAchat.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Prix de vente (FCFA)</Label>
              <Input type="number" {...register("prixVente")} />
              {errors.prixVente && (
                <p className="text-sm text-destructive">{errors.prixVente.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Input {...register("description")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEditMode ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

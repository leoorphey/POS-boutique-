import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCategorySchema, CreateCategoryInput } from "@pos/shared";
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
import { Category } from "@/features/categories/categories.api";
import {
  useCreateCategory,
  useUpdateCategory,
} from "@/features/categories/categories.hooks";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null; // si fourni -> mode édition
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: CategoryFormDialogProps) {
  const isEditMode = Boolean(category);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { nom: "", description: "" },
  });

  // Réinitialise le formulaire avec les valeurs de la catégorie à éditer
  // chaque fois que la modale s'ouvre sur une catégorie différente.
  useEffect(() => {
    if (open) {
      reset({
        nom: category?.nom ?? "",
        description: category?.description ?? "",
      });
    }
  }, [open, category, reset]);

  const onSubmit = async (values: CreateCategoryInput) => {
    if (isEditMode && category) {
      await updateMutation.mutateAsync({ id: category.id, input: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" placeholder="Ex: Téléphones" {...register("nom")} />
            {errors.nom && (
              <p className="text-sm text-destructive">{errors.nom.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Input
              id="description"
              placeholder="Ex: Smartphones neufs et reconditionnés"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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

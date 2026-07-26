import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, updateUserSchema, CreateUserInput } from "@pos/shared";
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
import { AppUser } from "@/features/users/users.api";
import { useCreateUser, useUpdateUser } from "@/features/users/users.hooks";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AppUser | null;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEditMode = Boolean(user);
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    // En édition, le mot de passe est optionnel (laisser vide = ne pas changer) ;
    // updateUserSchema reflète ça, contrairement à createUserSchema qui l'impose.
    resolver: zodResolver(isEditMode ? updateUserSchema : createUserSchema),
    defaultValues: { role: "VENDEUR" },
  });

  useEffect(() => {
    if (open) {
      reset({
        nom: user?.nom ?? "",
        email: user?.email ?? "",
        password: "",
        role: user?.role ?? "VENDEUR",
      });
    }
  }, [open, user, reset]);

  const onSubmit = async (values: CreateUserInput) => {
    if (isEditMode && user) {
      // En édition, un mot de passe vide signifie "ne pas changer" : on l'omet.
      const { password, ...rest } = values;
      await updateMutation.mutateAsync({
        id: user.id,
        input: password ? values : rest,
      });
    } else {
      await createMutation.mutateAsync(values);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Modifier le vendeur" : "Nouveau vendeur"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input {...register("nom")} />
            {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{isEditMode ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}</Label>
            <Input type="password" {...register("password")} />
            <p className="text-xs text-muted-foreground">8 caractères, au moins une majuscule, une minuscule, et un chiffre.</p>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Rôle</Label>
            <select
              {...register("role")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="VENDEUR">Vendeur</option>
              <option value="ADMIN">Administrateur</option>
            </select>
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

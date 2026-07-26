import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordInput } from "@pos/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResetPassword } from "@/features/auth/auth.hooks";
import { ArrowLeft, Eye, EyeOff, LayoutGrid } from "lucide-react";

export function ResetPasswordPage() {
  const { token } = useParams();
  const resetMutation = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = (values: ResetPasswordInput) => {
    if (!token) return;
    resetMutation.mutate({ token, input: values });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <LayoutGrid className="mb-2 h-8 w-8 text-primary" />
          <h1 className="text-xl font-semibold">Créer un nouveau mot de passe</h1>
          <p className="text-sm text-muted-foreground">Choisissez un mot de passe robuste et unique.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} {...register("password")} />
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
                onClick={() => setShowConfirmPassword((value) => !value)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || resetMutation.isPending || !token}>
            {isSubmitting || resetMutation.isPending ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

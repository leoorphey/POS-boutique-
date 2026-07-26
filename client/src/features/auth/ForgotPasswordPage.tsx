import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordInput } from "@pos/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPassword } from "@/features/auth/auth.hooks";
import { ArrowLeft, LayoutGrid } from "lucide-react";

export function ForgotPasswordPage() {
  const forgotMutation = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = (values: ForgotPasswordInput) => {
    forgotMutation.mutate(values);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <LayoutGrid className="mb-2 h-8 w-8 text-primary" />
          <h1 className="text-xl font-semibold">Mot de passe oublié</h1>
          <p className="text-sm text-muted-foreground">
            Saisissez votre adresse email administrateur pour recevoir un lien sécurisé.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="vous@boutique.com" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || forgotMutation.isPending}>
            {isSubmitting || forgotMutation.isPending ? "Envoi en cours..." : "Envoyer le lien"}
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

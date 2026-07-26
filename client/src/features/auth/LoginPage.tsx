import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@pos/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/features/auth/auth.hooks";
import { Eye, EyeOff, LayoutGrid } from "lucide-react";

export function LoginPage() {
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values: LoginInput) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm rounded-lg border bg-background p-8 shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <LayoutGrid className="h-8 w-8 text-primary mb-2" />
          <h1 className="text-xl font-semibold">POS Boutique Informatique</h1>
          <p className="text-sm text-muted-foreground">Connectez-vous pour continuer</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@boutique.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
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
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link to="/admin/forgot-password" className="text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
      </div>
    </div>
  );
}

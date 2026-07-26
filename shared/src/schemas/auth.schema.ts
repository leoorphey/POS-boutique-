import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token requis"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const resetPasswordTokenSchema = z.object({
  token: z.string().min(1, "Token requis"),
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "8 caractères minimum")
    .regex(/[a-z]/, "Au moins une minuscule")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial"),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Les mots de passe ne correspondent pas",
      path: ["confirmPassword"],
    });
  }
});

export const createUserSchema = z.object({
  nom: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string()
    .min(8, "8 caractères minimum")
    .regex(/[a-z]/, "Au moins une minuscule")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial"),
  role: z.enum(["ADMIN", "VENDEUR"]).default("VENDEUR"),
});

export const updateUserSchema = z.object({
  nom: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string()
    .min(8)
    .regex(/[a-z]/, "Au moins une minuscule")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial")
    .optional(),
  role: z.enum(["ADMIN", "VENDEUR"]).optional(),
  isActive: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

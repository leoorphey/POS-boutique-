import { z } from "zod";

export const createCategorySchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  description: z.string().max(500).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryIdParamSchema = z.object({
  id: z.string().min(1, "Identifiant de catégorie requis"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

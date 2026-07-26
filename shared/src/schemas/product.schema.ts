import { z } from "zod";

export const createProductSchema = z.object({
  nom: z.string().min(2).max(150),
  marque: z.string().min(1).max(100),
  modele: z.string().min(1).max(100),
  categorieId: z.string().min(1, "Catégorie requise"),
  ram: z.string().max(50).optional(),
  stockage: z.string().max(50).optional(),
  couleur: z.string().max(50).optional(),
  imei: z.string().max(50).optional(),
  numeroSerie: z.string().max(100).optional(),
  prixAchat: z.coerce.number().positive("Le prix d'achat doit être positif"),
  prixVente: z.coerce.number().positive("Le prix de vente doit être positif"),
  quantiteStock: z.coerce.number().int().min(0).default(0),
  description: z.string().max(1000).optional(),
  image: z.string().max(500).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  search: z.string().optional(),
  categorieId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const productIdParamSchema = z.object({
  id: z.string().min(1),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;

import { apiClient } from "@/api/client";
import { ApiSuccessResponse } from "@/types/api";
import { CreateProductInput, UpdateProductInput } from "@pos/shared";

export interface Product {
  id: string;
  nom: string;
  marque: string;
  modele: string;
  categorieId: string;
  categorie: { id: string; nom: string };
  ram: string | null;
  stockage: string | null;
  couleur: string | null;
  imei: string | null;
  numeroSerie: string | null;
  prixAchat: string;
  prixVente: string;
  quantiteStock: number;
  description: string | null;
  image: string | null;
  isActive: boolean;
}

export interface ProductListResult {
  items: Product[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const productsApi = {
  async list(params: { search?: string; categorieId?: string; page?: number; limit?: number }) {
    const { data } = await apiClient.get<ApiSuccessResponse<Product[]> & { meta: { pagination: ProductListResult["pagination"] } }>(
      "/products",
      { params }
    );
    return { items: data.data, pagination: data.meta.pagination };
  },

  async create(input: CreateProductInput): Promise<Product> {
    const { data } = await apiClient.post<ApiSuccessResponse<Product>>("/products", input);
    return data.data;
  },

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const { data } = await apiClient.patch<ApiSuccessResponse<Product>>(
      `/products/${id}`,
      input
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};

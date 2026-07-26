import { apiClient } from "@/api/client";
import { ApiSuccessResponse } from "@/types/api";
import { CreateCategoryInput, UpdateCategoryInput } from "@pos/shared";

export interface Category {
  id: string;
  nom: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { products: number };
}

export const categoriesApi = {
  async list(): Promise<Category[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<Category[]>>("/categories");
    return data.data;
  },

  async create(input: CreateCategoryInput): Promise<Category> {
    const { data } = await apiClient.post<ApiSuccessResponse<Category>>(
      "/categories",
      input
    );
    return data.data;
  },

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const { data } = await apiClient.patch<ApiSuccessResponse<Category>>(
      `/categories/${id}`,
      input
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};

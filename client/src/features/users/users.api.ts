import { apiClient } from "@/api/client";
import { ApiSuccessResponse } from "@/types/api";
import { CreateUserInput, UpdateUserInput } from "@pos/shared";

export interface AppUser {
  id: string;
  nom: string;
  email: string;
  role: "ADMIN" | "VENDEUR";
  isActive: boolean;
  createdAt: string;
}

export const usersApi = {
  async list(): Promise<AppUser[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<AppUser[]>>("/users");
    return data.data;
  },
  async create(input: CreateUserInput): Promise<AppUser> {
    const { data } = await apiClient.post<ApiSuccessResponse<AppUser>>("/users", input);
    return data.data;
  },
  async update(id: string, input: UpdateUserInput): Promise<AppUser> {
    const { data } = await apiClient.patch<ApiSuccessResponse<AppUser>>(`/users/${id}`, input);
    return data.data;
  },
  async deactivate(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};

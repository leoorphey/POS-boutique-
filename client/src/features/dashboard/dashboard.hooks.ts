import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { ApiSuccessResponse } from "@/types/api";

interface DashboardOverview {
  today: { nombreVentes: number; chiffreAffaires: number; produitsVendus: number };
  monthly: { nombreVentes: number; chiffreAffaires: number; panierMoyen: number };
  stock: {
    totalProducts: number;
    totalUnits: number;
    lowStockThreshold: number;
    lowStockProducts: Array<{ id: string; nom: string; marque: string; quantiteStock: number }>;
  };
}

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccessResponse<DashboardOverview>>(
        "/dashboard/overview"
      );
      return data.data;
    },
  });
}

export function useSalesByDay() {
  return useQuery({
    queryKey: ["dashboard", "sales-by-day"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccessResponse<{ date: string; total: number }[]>>(
        "/dashboard/sales-by-day"
      );
      return data.data;
    },
  });
}

export function useTopProducts() {
  return useQuery({
    queryKey: ["dashboard", "top-products"],
    queryFn: async () => {
      const { data } = await apiClient.get<
        ApiSuccessResponse<{ productId: string; nom: string; quantiteVendue: number }[]>
      >("/dashboard/top-products");
      return data.data;
    },
  });
}

export function useTopCategories() {
  return useQuery({
    queryKey: ["dashboard", "top-categories"],
    queryFn: async () => {
      const { data } = await apiClient.get<
        ApiSuccessResponse<{ categorie: string; chiffreAffaires: number }[]>
      >("/dashboard/top-categories");
      return data.data;
    },
  });
}

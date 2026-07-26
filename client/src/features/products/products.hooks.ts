import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/features/products/products.api";
import { pushToast } from "@/hooks/use-toast";
import { extractErrorMessage } from "@/types/api";
import { CreateProductInput, UpdateProductInput } from "@pos/shared";

export function useProducts(params: { search?: string; categorieId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.list(params),
    placeholderData: (prev) => prev, // garde l'affichage pendant le re-fetch (évite le flash de chargement à chaque frappe)
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) => productsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      pushToast({ title: "Produit créé", variant: "success" });
    },
    onError: (error) =>
      pushToast({
        title: "Erreur",
        description: extractErrorMessage(error),
        variant: "destructive",
      }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      productsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      pushToast({ title: "Produit mis à jour", variant: "success" });
    },
    onError: (error) =>
      pushToast({
        title: "Erreur",
        description: extractErrorMessage(error),
        variant: "destructive",
      }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      pushToast({ title: "Produit retiré du catalogue", variant: "success" });
    },
    onError: (error) =>
      pushToast({
        title: "Erreur",
        description: extractErrorMessage(error),
        variant: "destructive",
      }),
  });
}

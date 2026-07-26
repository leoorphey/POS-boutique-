import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "@/features/categories/categories.api";
import { pushToast } from "@/hooks/use-toast";
import { extractErrorMessage } from "@/types/api";
import { CreateCategoryInput, UpdateCategoryInput } from "@pos/shared";

const CATEGORIES_KEY = ["categories"];

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: categoriesApi.list,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoriesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      pushToast({ title: "Catégorie créée", variant: "success" });
    },
    onError: (error) => {
      pushToast({
        title: "Erreur",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      categoriesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      pushToast({ title: "Catégorie mise à jour", variant: "success" });
    },
    onError: (error) => {
      pushToast({
        title: "Erreur",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      pushToast({ title: "Catégorie supprimée", variant: "success" });
    },
    onError: (error) => {
      pushToast({
        title: "Impossible de supprimer",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}

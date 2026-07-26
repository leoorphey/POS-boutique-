import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesApi } from "@/features/pos/sales.api";
import { extractErrorMessage } from "@/types/api";
import { pushToast } from "@/hooks/use-toast";
import { CreateSaleInput } from "@pos/shared";

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) => salesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] }); // stock a changé
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (error) => {
      pushToast({
        title: "Vente impossible",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}

export function useSale(id: string | null) {
  return useQuery({
    queryKey: ["sales", id],
    queryFn: () => salesApi.getById(id!),
    enabled: !!id,
    // Pour une vente Wave en attente, on repolle pour détecter la confirmation
    // du paiement (le webhook met à jour le statut côté serveur de façon asynchrone).
    refetchInterval: (query) => (query.state.data?.status === "PENDING" ? 3000 : false),
  });
}

export function useSales() {
  return useQuery({ queryKey: ["sales"], queryFn: salesApi.list });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/features/users/users.api";
import { pushToast } from "@/hooks/use-toast";
import { extractErrorMessage } from "@/types/api";
import { CreateUserInput, UpdateUserInput } from "@pos/shared";

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: usersApi.list });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      pushToast({ title: "Vendeur créé", variant: "success" });
    },
    onError: (error) =>
      pushToast({
        title: "Erreur",
        description: extractErrorMessage(error),
        variant: "destructive",
      }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      usersApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      pushToast({ title: "Vendeur mis à jour", variant: "success" });
    },
    onError: (error) =>
      pushToast({
        title: "Erreur",
        description: extractErrorMessage(error),
        variant: "destructive",
      }),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      pushToast({ title: "Vendeur désactivé", variant: "success" });
    },
    onError: (error) =>
      pushToast({
        title: "Erreur",
        description: extractErrorMessage(error),
        variant: "destructive",
      }),
  });
}

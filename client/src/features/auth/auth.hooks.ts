import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { pushToast } from "@/hooks/use-toast";
import { extractErrorMessage } from "@/types/api";
import { ForgotPasswordInput, LoginInput, ResetPasswordInput } from "@pos/shared";

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => {
      setSession(data.user, data.accessToken, data.refreshToken);
      pushToast({ title: `Bienvenue, ${data.user.nom}`, variant: "success" });
      navigate("/");
    },
    onError: (error) => {
      pushToast({
        title: "Connexion impossible",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => authApi.forgotPassword(input),
    onSuccess: (data) => {
      pushToast({
        title: "Email envoyé",
        description: data.message,
        variant: "success",
      });
    },
    onError: (error) => {
      pushToast({
        title: "Demande impossible",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}

export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ token, input }: { token: string; input: ResetPasswordInput }) =>
      authApi.resetPassword(token, input),
    onSuccess: (data) => {
      pushToast({
        title: "Mot de passe modifié",
        description: data.message,
        variant: "success",
      });
      navigate("/login");
    },
    onError: (error) => {
      pushToast({
        title: "Réinitialisation impossible",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    },
  });
}

export function useLogout() {
  const { refreshToken, clearSession } = useAuthStore();
  const navigate = useNavigate();

  return async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      clearSession();
      navigate("/login");
    }
  };
}

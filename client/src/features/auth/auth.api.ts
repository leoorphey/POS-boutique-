import { apiClient } from "@/api/client";
import { ApiSuccessResponse } from "@/types/api";
import { ForgotPasswordInput, LoginInput, ResetPasswordInput } from "@pos/shared";
import { AuthUser } from "@/features/auth/auth.store";

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  async login(input: LoginInput): Promise<AuthResponse> {
    const { data } = await apiClient.post<ApiSuccessResponse<AuthResponse>>(
      "/auth/login",
      input
    );
    return data.data;
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
    const { data } = await apiClient.post<ApiSuccessResponse<{ message: string }>>(
      "/auth/forgot-password",
      input
    );
    return data.data;
  },

  async resetPassword(token: string, input: ResetPasswordInput): Promise<{ message: string }> {
    const { data } = await apiClient.post<ApiSuccessResponse<{ message: string }>>(
      `/auth/reset-password/${token}`,
      input
    );
    return data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post("/auth/logout", { refreshToken });
  },
};

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/features/auth/auth.store";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Ajoute automatiquement le token d'accès à chaque requête.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Gestion du refresh automatique sur 401 ---
// Si plusieurs requêtes échouent en même temps avec un 401, on ne veut
// déclencher qu'UN seul appel /auth/refresh, et faire patienter les autres.
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function resolveQueue(token: string | null) {
  pendingQueue.forEach((resolve) => resolve(token));
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const isUnauthorized = error.response?.status === 401;
    const isAuthRoute = originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (!isUnauthorized || isAuthRoute || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const { refreshToken, setAccessToken, clearSession } = useAuthStore.getState();

    if (!refreshToken) {
      clearSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // Une autre requête a déjà déclenché le refresh : on attend son résultat.
      return new Promise((resolve, reject) => {
        pendingQueue.push((newToken) => {
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          } else {
            reject(error);
          }
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post(
        `${apiClient.defaults.baseURL}/auth/refresh`,
        { refreshToken }
      );
      const newAccessToken = data.data.accessToken;
      setAccessToken(newAccessToken);
      resolveQueue(newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      resolveQueue(null);
      clearSession();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

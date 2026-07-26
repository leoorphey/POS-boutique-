import { create } from "zustand";

export interface AuthUser {
  id: string;
  nom: string;
  email: string;
  role: "ADMIN" | "VENDEUR";
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  // indique que le store a lu localStorage et peut être utilisé
  isHydrated: boolean;
  setSession: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
  hydrate: () => void;
}

const ACCESS_KEY = "pos_access_token";
const REFRESH_KEY = "pos_refresh_token";
const USER_KEY = "pos_user";

// Lit localStorage *synchronement* lors de l'initialisation du store
function readInitialSession() {
  try {
    const accessToken = localStorage.getItem(ACCESS_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    if (accessToken && refreshToken && userRaw) {
      return {
        user: JSON.parse(userRaw) as AuthUser,
        accessToken,
        refreshToken,
      };
    }
  } catch {
    // ignore
  }
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
  };
}

const initial = readInitialSession();

export const useAuthStore = create<AuthState>((set) => ({
  user: initial.user,
  accessToken: initial.accessToken,
  refreshToken: initial.refreshToken,
  isHydrated: true,

  setSession: (user, accessToken, refreshToken) => {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, accessToken, refreshToken });
  },

  setAccessToken: (accessToken) => {
    localStorage.setItem(ACCESS_KEY, accessToken);
    set({ accessToken });
  },

  clearSession: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, accessToken: null, refreshToken: null });
  },

  // Pour compatibilité : garde une méthode publique qui force une relecture
  hydrate: () => {
    const session = readInitialSession();
    set({
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      isHydrated: true,
    });
  },
}));

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { authApi } from "@/lib/api/services";
import { ApiClientError } from "@/lib/api/client";
import { getUserIdFromToken } from "@/lib/auth/jwt";
import {
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from "@/lib/auth/storage";
import type { LoginPayload, RegisterPayload, User } from "@/types/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_PATHS = ["/login", "/register"];

function redirectToDashboard() {
  window.location.replace("/dashboard");
}

function buildUserFromToken(token: string, email?: string, name?: string): User | null {
  const userId = getUserIdFromToken(token);
  if (!userId) return null;

  return {
    id: userId,
    email: email ?? "",
    name: name ?? "Utilisateur",
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const isAuthPage = AUTH_PATHS.some((p) => pathname?.startsWith(p));

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const cached = getStoredUser();
    if (cached?.id) {
      setUser(cached);
    }

    try {
      const profile = await authApi.me();
      setUser(profile);
      setStoredUser(profile);
    } catch {
      if (!cached?.id) {
        const fallback = buildUserFromToken(token);
        if (fallback) {
          setUser(fallback);
          setStoredUser(fallback);
        } else {
          clearToken();
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }
    loadUser();
  }, [isAuthPage, loadUser]);

  const completeAuth = useCallback(
    async (token: string, profile?: User, email?: string, name?: string) => {
      const trimmed = token?.trim();
      if (!trimmed) {
        throw new ApiClientError(
          "Réponse de connexion invalide : token manquant",
          500,
        );
      }

      setToken(trimmed);

      let finalUser = profile?.id ? profile : null;

      if (!finalUser) {
        finalUser = buildUserFromToken(trimmed, email, name);
      }

      if (!finalUser?.id && email) {
        const userId = getUserIdFromToken(trimmed);
        finalUser = {
          id: userId ?? email,
          email,
          name: name ?? "Utilisateur",
          createdAt: new Date().toISOString(),
        };
      }

      if (!finalUser?.id) {
        try {
          finalUser = await authApi.me();
        } catch {
          /* /me optionnel — on redirige quand même si le token est valide */
        }
      }

      if (finalUser?.id) {
        setUser(finalUser);
        setStoredUser(finalUser);
      }

      // Toujours rediriger après un token reçu (login API = 200)
      redirectToDashboard();
    },
    [],
  );

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await authApi.login(payload);
      await completeAuth(response.token, response.user, payload.email);
    },
    [completeAuth],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await authApi.register(payload);
      await completeAuth(
        response.token,
        response.user,
        payload.email,
        payload.name,
      );
    },
    [completeAuth],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    window.location.href = "/login";
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (
    error instanceof TypeError &&
    error.message === "Failed to fetch"
  ) {
    return "Impossible de contacter le serveur. Vérifiez votre connexion réseau.";
  }
  return "Une erreur inattendue est survenue. Veuillez réessayer.";
}

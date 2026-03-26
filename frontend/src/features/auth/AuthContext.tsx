import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "./api";
import type { AuthUser, LoginPayload, RegisterPayload } from "./types";
import { getCurrentFarm } from "../farms/api";
import type { Farm } from "../farms/types";

type AuthContextValue = {
  user: AuthUser | null;
  farm: Farm | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Purpose: global auth state for the frontend app.
// It keeps both the authenticated user and that user's current farm in memory.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);

      try {
        const currentFarm = await getCurrentFarm();
        setFarm(currentFarm);
      } catch {
        setFarm(null);
      }

      return currentUser;
    } catch {
      setUser(null);
      setFarm(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (payload: LoginPayload) => {
    await loginUser(payload);
    const currentUser = await refreshAuth();

    if (!currentUser) {
      throw new Error("Login succeeded but the session could not be restored.");
    }
  };

  const register = async (payload: RegisterPayload) => {
    await registerUser(payload);
    const currentUser = await refreshAuth();

    if (!currentUser) {
      throw new Error("Registration succeeded but the session could not be restored.");
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setFarm(null);
  };

  const value = useMemo(
    () => ({
      user,
      farm,
      loading,
      login,
      register,
      logout,
      refreshAuth,
    }),
    [user, farm, loading, refreshAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Purpose: hook for using auth state in pages/components.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

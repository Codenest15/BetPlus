"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchCurrentUser,
  loginUser as apiLogin,
  registerUser as apiRegister,
  setAccessToken,
  useBackendApi,
  type BackendUser,
} from "./backend-client";
import {
  getCurrentUser,
  getUserSettings,
  loginUser as localLogin,
  logoutUser as localLogout,
  registerUser as localRegister,
  updateUserPassword,
  updateUserProfile,
  updateUserSettings,
  updateUserBalance,
} from "./auth-store";
import { ensureDemoHistoryBets } from "./bet-store";
import {
  clearPendingReferralCode,
  getPendingReferralCode,
} from "./referral-store";
import type { User, UserSettings } from "./user-types";
import { DEFAULT_SETTINGS, canUseManagerTools } from "./user-types";

type AuthModal = "login" | "register" | null;

interface AuthContextValue {
  user: User | null;
  settings: UserSettings;
  isLoading: boolean;
  authModal: AuthModal;
  openLogin: () => void;
  openRegister: () => void;
  closeAuthModal: () => void;
  login: (identifier: string, password: string) => Promise<string | null>;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<string | null>;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, "name" | "email" | "phone">>) => string | null;
  changePassword: (current: string, next: string) => string | null;
  saveSettings: (settings: Partial<UserSettings>) => void;
  canManage: boolean;
  setManagerMode: (enabled: boolean) => void;
  refreshUser: () => void;
  deductBalance: (amount: number) => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function backendToUser(u: BackendUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? "",
    balance: u.balance,
    createdAt: u.created_at,
    isManager: u.is_manager,
    referralCode: u.referral_code ?? undefined,
    referredByManagerId: u.referred_by_manager_id ?? undefined,
  };
}

function settingsFromBackend(raw: Record<string, unknown> | undefined): UserSettings {
  return {
    notifications: Boolean(raw?.notifications ?? true),
    oddsFormat: (raw?.oddsFormat as UserSettings["oddsFormat"]) ?? "decimal",
    language: String(raw?.language ?? "en"),
    managerMode: Boolean(raw?.managerMode ?? false),
  };
}

function usersEqual(a: User | null, b: User | null): boolean {
  if (a === b) return true;
  if (!a || !b) return a === b;
  return (
    a.id === b.id &&
    a.balance === b.balance &&
    a.name === b.name &&
    a.email === b.email &&
    a.phone === b.phone &&
    a.isManager === b.isManager
  );
}

function settingsEqual(a: UserSettings, b: UserSettings): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const backendMode = useBackendApi();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [authModal, setAuthModal] = useState<AuthModal>(null);

  const refreshUser = useCallback(async () => {
    if (backendMode) {
      try {
        const remote = await fetchCurrentUser();
        setUser(backendToUser(remote));
        setSettings(settingsFromBackend(remote.settings));
      } catch {
        setAccessToken(null);
        setUser(null);
        setSettings(DEFAULT_SETTINGS);
      }
      return;
    }

    const current = getCurrentUser();
    setUser((prev) => (usersEqual(prev, current) ? prev : current));
    if (current) {
      const nextSettings = getUserSettings(current.id) ?? DEFAULT_SETTINGS;
      setSettings((prev) => (settingsEqual(prev, nextSettings) ? prev : nextSettings));
    }
  }, [backendMode]);

  useEffect(() => {
    async function bootstrap() {
      if (backendMode) {
        await refreshUser();
      } else {
        const current = getCurrentUser();
        setUser(current);
        if (current) {
          ensureDemoHistoryBets(current.id);
          setSettings(getUserSettings(current.id) ?? DEFAULT_SETTINGS);
        }
      }
      setIsLoading(false);
    }
    void bootstrap();
  }, [backendMode, refreshUser]);

  useEffect(() => {
    function onBalanceUpdated(event: Event) {
      if (backendMode) return;
      const { userId } = (event as CustomEvent<{ userId: string }>).detail;
      setUser((current) => {
        if (!current || current.id !== userId) return current;
        const next = getCurrentUser();
        return usersEqual(current, next) ? current : next;
      });
    }

    window.addEventListener("betplus:balance-updated", onBalanceUpdated);
    return () => window.removeEventListener("betplus:balance-updated", onBalanceUpdated);
  }, [backendMode]);

  const login = useCallback(
    async (identifier: string, password: string): Promise<string | null> => {
      if (backendMode) {
        try {
          const token = await apiLogin({ identifier, password });
          setAccessToken(token.access_token);
          await refreshUser();
          setAuthModal(null);
          return null;
        } catch (err) {
          return err instanceof Error ? err.message : "Login failed";
        }
      }

      const result = localLogin({ identifier, password });
      if ("error" in result) return result.error;
      setUser(result.user);
      ensureDemoHistoryBets(result.user.id);
      setSettings(getUserSettings(result.user.id) ?? DEFAULT_SETTINGS);
      setAuthModal(null);
      return null;
    },
    [backendMode, refreshUser],
  );

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      phone: string;
      password: string;
    }): Promise<string | null> => {
      if (backendMode) {
        try {
          const referralCode = getPendingReferralCode() ?? undefined;
          await apiRegister({ ...input, referralCode });
          clearPendingReferralCode();
          const token = await apiLogin({
            identifier: input.email,
            password: input.password,
          });
          setAccessToken(token.access_token);
          await refreshUser();
          setAuthModal(null);
          return null;
        } catch (err) {
          return err instanceof Error ? err.message : "Registration failed";
        }
      }

      const referralCode = getPendingReferralCode() ?? undefined;
      const result = localRegister({ ...input, referralCode });
      if ("error" in result) return result.error;
      clearPendingReferralCode();
      setUser(result.user);
      ensureDemoHistoryBets(result.user.id);
      setSettings(DEFAULT_SETTINGS);
      setAuthModal(null);
      return null;
    },
    [backendMode, refreshUser],
  );

  const logout = useCallback(() => {
    if (backendMode) {
      setAccessToken(null);
    } else {
      localLogout();
    }
    setUser(null);
    setSettings(DEFAULT_SETTINGS);
  }, [backendMode]);

  const updateProfile = useCallback(
    (updates: Partial<Pick<User, "name" | "email" | "phone">>) => {
      if (backendMode) return "Profile updates require backend API (not yet wired).";
      if (!user) return "Not logged in.";
      const result = updateUserProfile(user.id, updates);
      if ("error" in result) return result.error;
      setUser(result.user);
      return null;
    },
    [backendMode, user],
  );

  const changePassword = useCallback(
    (current: string, next: string) => {
      if (backendMode) return "Password change requires backend API (not yet wired).";
      if (!user) return "Not logged in.";
      const result = updateUserPassword(user.id, current, next);
      if ("error" in result) return result.error;
      return null;
    },
    [backendMode, user],
  );

  const saveSettings = useCallback(
    (partial: Partial<UserSettings>) => {
      if (backendMode) {
        setSettings((prev) => ({ ...prev, ...partial }));
        return;
      }
      if (!user) return;
      const updated = updateUserSettings(user.id, partial);
      if (updated) setSettings(updated);
    },
    [backendMode, user],
  );

  const setManagerMode = useCallback(
    (enabled: boolean) => {
      saveSettings({ managerMode: enabled });
    },
    [saveSettings],
  );

  const canManage = canUseManagerTools(user, settings);

  const deductBalance = useCallback(
    (amount: number) => {
      if (backendMode) return "Use backend bet placement (not local deduct).";
      if (!user) return "Not logged in.";
      const result = updateUserBalance(user.id, -amount);
      if ("error" in result) return result.error;
      setUser(result.user);
      return null;
    },
    [backendMode, user],
  );

  const value = useMemo(
    () => ({
      user,
      settings,
      isLoading,
      authModal,
      openLogin: () => setAuthModal("login"),
      openRegister: () => setAuthModal("register"),
      closeAuthModal: () => setAuthModal(null),
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      saveSettings,
      canManage,
      setManagerMode,
      refreshUser: () => {
        void refreshUser();
      },
      deductBalance,
    }),
    [
      user,
      settings,
      isLoading,
      authModal,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      saveSettings,
      canManage,
      setManagerMode,
      refreshUser,
      deductBalance,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

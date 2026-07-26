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
  getCurrentUser,
  getUserSettings,
  loginUser,
  logoutUser,
  registerUser,
  updateUserPassword,
  updateUserProfile,
  updateUserSettings,
  updateUserBalance,
} from "./auth-store";
import { ensureDemoHistoryBets } from "./bet-store";
import type { User, UserSettings } from "./user-types";
import { DEFAULT_SETTINGS } from "./user-types";

type AuthModal = "login" | "register" | null;

interface AuthContextValue {
  user: User | null;
  settings: UserSettings;
  isLoading: boolean;
  authModal: AuthModal;
  openLogin: () => void;
  openRegister: () => void;
  closeAuthModal: () => void;
  login: (identifier: string, password: string) => string | null;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => string | null;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, "name" | "email" | "phone">>) => string | null;
  changePassword: (current: string, next: string) => string | null;
  saveSettings: (settings: Partial<UserSettings>) => void;
  refreshUser: () => void;
  deductBalance: (amount: number) => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [authModal, setAuthModal] = useState<AuthModal>(null);

  useEffect(() => {
    const current = getCurrentUser();
    setUser(current);
    if (current) {
      ensureDemoHistoryBets(current.id);
      setSettings(getUserSettings(current.id) ?? DEFAULT_SETTINGS);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((identifier: string, password: string) => {
    const result = loginUser({ identifier, password });
    if ("error" in result) return result.error;
    setUser(result.user);
    ensureDemoHistoryBets(result.user.id);
    setSettings(getUserSettings(result.user.id) ?? DEFAULT_SETTINGS);
    setAuthModal(null);
    return null;
  }, []);

  const register = useCallback(
    (input: { name: string; email: string; phone: string; password: string }) => {
      const result = registerUser(input);
      if ("error" in result) return result.error;
      setUser(result.user);
      ensureDemoHistoryBets(result.user.id);
      setSettings(DEFAULT_SETTINGS);
      setAuthModal(null);
      return null;
    },
    [],
  );

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const updateProfile = useCallback(
    (updates: Partial<Pick<User, "name" | "email" | "phone">>) => {
      if (!user) return "Not logged in.";
      const result = updateUserProfile(user.id, updates);
      if ("error" in result) return result.error;
      setUser(result.user);
      return null;
    },
    [user],
  );

  const changePassword = useCallback(
    (current: string, next: string) => {
      if (!user) return "Not logged in.";
      const result = updateUserPassword(user.id, current, next);
      if ("error" in result) return result.error;
      return null;
    },
    [user],
  );

  const saveSettings = useCallback(
    (partial: Partial<UserSettings>) => {
      if (!user) return;
      const updated = updateUserSettings(user.id, partial);
      if (updated) setSettings(updated);
    },
    [user],
  );

  const refreshUser = useCallback(() => {
    const current = getCurrentUser();
    setUser(current);
    if (current) {
      setSettings(getUserSettings(current.id) ?? DEFAULT_SETTINGS);
    }
  }, []);

  const deductBalance = useCallback(
    (amount: number) => {
      if (!user) return "Not logged in.";
      const result = updateUserBalance(user.id, -amount);
      if ("error" in result) return result.error;
      setUser(result.user);
      return null;
    },
    [user],
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
      refreshUser,
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

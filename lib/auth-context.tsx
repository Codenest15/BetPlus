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
  changePassword as apiChangePassword,
  fetchCurrentUser,
  getAccessToken,
  loginUserWithPhoneVariants as apiLoginWithPhone,
  registerUser as apiRegister,
  setAccessToken,
  updateProfile as apiUpdateProfile,
  updateSettings as apiUpdateSettings,
  useBackendApi,
  type BackendUser,
} from "./backend-client";
import { backendUserToLocal } from "./backend-mappers";
import {
  getCurrentUser,
  getUserSettings,
  loginUser as localLogin,
  logoutUser as localLogout,
  registerUser as localRegister,
  ensureStaffAccount,
  updateUserPassword,
  updateUserProfile,
  updateUserSettings,
  updateUserBalance,
} from "./auth-store";
import {
  claimManagerSessionForUser,
  isManagerSessionValid,
} from "./manager-session-guard";
import {
  clearManagerDeviceSession,
  emitManagerSessionKicked,
} from "./manager-session";
import { formatStoredPhone } from "./phone-countries";
import { userPhoneIsStaff } from "./staff-config";
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
  login: (
    phoneCountry: string,
    phone: string,
    password: string,
  ) => Promise<string | null>;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    phoneCountry: string;
    password: string;
    referralCode?: string;
  }) => Promise<string | null>;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, "name" | "email" | "phone">>) => Promise<string | null>;
  changePassword: (current: string, next: string) => Promise<string | null>;
  saveSettings: (settings: Partial<UserSettings>) => void;
  canManage: boolean;
  setManagerMode: (enabled: boolean) => void;
  refreshUser: () => Promise<void>;
  deductBalance: (amount: number) => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function backendToUser(u: BackendUser): User {
  return backendUserToLocal(u);
}

function settingsFromBackend(
  raw: Record<string, unknown> | undefined,
  user: BackendUser,
): UserSettings {
  const staffOwner = userPhoneIsStaff(user.phone ?? "");
  return {
    notifications: Boolean(raw?.notifications ?? true),
    oddsFormat: (raw?.oddsFormat as UserSettings["oddsFormat"]) ?? "decimal",
    language: String(raw?.language ?? "en"),
    managerMode: Boolean(raw?.managerMode ?? (staffOwner || user.is_manager)),
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
        const nextUser = backendToUser(remote);
        if (nextUser.isManager) {
          const sessionOk = await isManagerSessionValid(nextUser, true);
          if (!sessionOk) {
            setAccessToken(null);
            clearManagerDeviceSession();
            setUser(null);
            setSettings(DEFAULT_SETTINGS);
            emitManagerSessionKicked();
            return;
          }
        }
        setUser(nextUser);
        setSettings(settingsFromBackend(remote.settings, remote));
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
        ensureStaffAccount();
        const current = getCurrentUser();
        setUser(current);
        if (current) {
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
    async (
      phoneCountry: string,
      phone: string,
      password: string,
    ): Promise<string | null> => {
      if (backendMode) {
        try {
          const token = await apiLoginWithPhone({
            phoneCountry,
            phone,
            password,
          });
          setAccessToken(token.access_token);
          const remote = await fetchCurrentUser();
          const nextUser = backendToUser(remote);
          setUser(nextUser);
          setSettings(settingsFromBackend(remote.settings, remote));
          if (nextUser.isManager) {
            await claimManagerSessionForUser(nextUser, token.access_token);
          } else {
            clearManagerDeviceSession();
          }
          setAuthModal(null);
          return null;
        } catch (err) {
          return err instanceof Error ? err.message : "Login failed";
        }
      }

      const result = localLogin({ phoneCountry, phone, password });
      if ("error" in result) return result.error;
      setUser(result.user);
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
      phoneCountry: string;
      password: string;
      referralCode?: string;
    }): Promise<string | null> => {
      const referralCode =
        input.referralCode?.trim() || getPendingReferralCode() || undefined;
      const storedPhone = formatStoredPhone(input.phoneCountry, input.phone);
      const email = input.email.trim().toLowerCase();

      if (backendMode) {
        try {
          await apiRegister({
            name: input.name,
            email,
            phone: storedPhone,
            password: input.password,
            referralCode,
          });
          clearPendingReferralCode();
          const token = await apiLoginWithPhone({
            phoneCountry: input.phoneCountry,
            phone: input.phone,
            password: input.password,
            extraUsernames: [email],
          });
          setAccessToken(token.access_token);
          await refreshUser();
          setAuthModal(null);
          return null;
        } catch (err) {
          return err instanceof Error ? err.message : "Registration failed";
        }
      }

      const result = localRegister({ ...input, referralCode });
      if ("error" in result) return result.error;
      clearPendingReferralCode();
      setUser(result.user);
      setSettings(DEFAULT_SETTINGS);
      setAuthModal(null);
      return null;
    },
    [backendMode, refreshUser],
  );

  const logout = useCallback(() => {
    if (backendMode) {
      const token = getAccessToken();
      if (token && user?.isManager) {
        void fetch("/api/manager/session", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setAccessToken(null);
    } else {
      localLogout();
    }
    clearManagerDeviceSession();
    setUser(null);
    setSettings(DEFAULT_SETTINGS);
  }, [backendMode, user?.isManager]);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<User, "name" | "email" | "phone">>) => {
      if (backendMode) {
        try {
          const remote = await apiUpdateProfile(updates);
          setUser(backendToUser(remote));
          return null;
        } catch (err) {
          return err instanceof Error ? err.message : "Profile update failed";
        }
      }
      if (!user) return "Not logged in.";
      const result = updateUserProfile(user.id, updates);
      if ("error" in result) return result.error;
      setUser(result.user);
      return null;
    },
    [backendMode, user],
  );

  const changePassword = useCallback(
    async (current: string, next: string) => {
      if (backendMode) {
        try {
          await apiChangePassword({ currentPassword: current, newPassword: next });
          return null;
        } catch (err) {
          return err instanceof Error ? err.message : "Password change failed";
        }
      }
      if (!user) return "Not logged in.";
      const result = updateUserPassword(user.id, current, next);
      if ("error" in result) return result.error;
      return null;
    },
    [backendMode, user],
  );

  const saveSettings = useCallback(
    (partial: Partial<UserSettings>) => {
      setSettings((prev) => ({ ...prev, ...partial }));
      if (backendMode) {
        void apiUpdateSettings(partial)
          .then((remote) => {
            setSettings(settingsFromBackend(remote.settings, remote));
          })
          .catch(() => {
            /* keep optimistic local settings */
          });
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

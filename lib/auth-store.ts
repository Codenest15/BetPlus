import type { StoredUser, User, UserSettings } from "./user-types";
import { DEFAULT_SETTINGS } from "./user-types";

const USERS_KEY = "betplus_users";
const SESSION_KEY = "betplus_session";

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionUserId(id: string | null) {
  if (id) {
    localStorage.setItem(SESSION_KEY, id);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function getCurrentUser(): User | null {
  const id = getSessionUserId();
  if (!id) return null;
  const user = readUsers().find((u) => u.id === id);
  if (!user) return null;
  const { password: _, settings: __, ...publicUser } = user;
  return publicUser;
}

export function registerUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): { user: User } | { error: string } {
  const users = readUsers();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();

  if (users.some((u) => u.email === email)) {
    return { error: "An account with this email already exists." };
  }
  if (users.some((u) => u.phone === phone)) {
    return { error: "An account with this phone number already exists." };
  }
  if (input.password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const stored: StoredUser = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    phone,
    password: input.password,
    balance: 50,
    createdAt: new Date().toISOString(),
    settings: DEFAULT_SETTINGS,
  };

  users.push(stored);
  writeUsers(users);
  setSessionUserId(stored.id);

  const { password: _, settings: __, ...user } = stored;
  return { user };
}

export function loginUser(input: {
  identifier: string;
  password: string;
}): { user: User } | { error: string } {
  const users = readUsers();

  const identifier = input.identifier.trim();
  const found = users.find(
    (u) =>
      u.email === identifier.toLowerCase() || u.phone === identifier,
  );

  if (!found || found.password !== input.password) {
    return { error: "Invalid email/phone or password." };
  }

  setSessionUserId(found.id);
  const { password: _, settings: __, ...user } = found;
  return { user };
}

export function logoutUser() {
  setSessionUserId(null);
}

export function updateUserProfile(
  userId: string,
  updates: Partial<Pick<User, "name" | "email" | "phone">>,
): { user: User } | { error: string } {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return { error: "User not found." };

  const current = users[index];
  if (updates.email && updates.email !== current.email) {
    if (users.some((u) => u.email === updates.email && u.id !== userId)) {
      return { error: "Email is already in use." };
    }
  }
  if (updates.phone && updates.phone !== current.phone) {
    if (users.some((u) => u.phone === updates.phone && u.id !== userId)) {
      return { error: "Phone number is already in use." };
    }
  }

  users[index] = { ...current, ...updates };
  writeUsers(users);

  const { password: _, settings: __, ...user } = users[index];
  return { user };
}

export function updateUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): { ok: true } | { error: string } {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return { error: "User not found." };
  if (users[index].password !== currentPassword) {
    return { error: "Current password is incorrect." };
  }
  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters." };
  }

  users[index].password = newPassword;
  writeUsers(users);
  return { ok: true };
}

export function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>,
): UserSettings | null {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  users[index].settings = { ...users[index].settings, ...settings };
  writeUsers(users);
  return users[index].settings;
}

export function getUserSettings(userId: string): UserSettings | null {
  const user = readUsers().find((u) => u.id === userId);
  return user?.settings ?? null;
}

export function updateUserBalance(
  userId: string,
  delta: number,
): { user: User } | { error: string } {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return { error: "User not found." };

  const newBalance = users[index].balance + delta;
  if (newBalance < 0) return { error: "Insufficient balance." };

  users[index].balance = Math.round(newBalance * 100) / 100;
  writeUsers(users);

  const { password: _, settings: __, ...user } = users[index];
  return { user };
}

const ADMIN_SESSION_KEY = "betplus_admin_session";

/** Demo admin — change before production */
export const DEFAULT_ADMIN = {
  email: "admin@betplus.com",
  password: "admin123",
  name: "BetPlus Admin",
};

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_SESSION_KEY) === "active";
}

export function adminLogin(email: string, password: string): boolean {
  const ok =
    email.trim().toLowerCase() === DEFAULT_ADMIN.email &&
    password === DEFAULT_ADMIN.password;
  if (ok) localStorage.setItem(ADMIN_SESSION_KEY, "active");
  return ok;
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export interface AdminAuditEntry {
  id: string;
  action: string;
  detail: string;
  at: string;
  betId?: string;
  bookingCode?: string;
}

const AUDIT_KEY = "betplus_admin_audit";

export function logAdminAction(
  action: string,
  detail: string,
  meta?: { betId?: string; bookingCode?: string },
) {
  if (typeof window === "undefined") return;
  const entry: AdminAuditEntry = {
    id: crypto.randomUUID(),
    action,
    detail,
    at: new Date().toISOString(),
    betId: meta?.betId,
    bookingCode: meta?.bookingCode,
  };
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    const list: AdminAuditEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(list.slice(0, 200)));
  } catch {
    /* ignore */
  }
}

export function getAdminAuditLog(): AdminAuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    return raw ? (JSON.parse(raw) as AdminAuditEntry[]) : [];
  } catch {
    return [];
  }
}

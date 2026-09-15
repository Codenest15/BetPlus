const MANAGER_DEVICE_KEY = "betplus_manager_device_session";

export const MANAGER_SESSION_KICKED_EVENT = "betplus:manager-session-kicked";

export function emitManagerSessionKicked() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MANAGER_SESSION_KICKED_EVENT));
}

export interface ManagerDeviceSession {
  userId: string;
  sessionId: string;
}

export function readManagerDeviceSession(): ManagerDeviceSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MANAGER_DEVICE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ManagerDeviceSession;
    if (!parsed.userId || !parsed.sessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeManagerDeviceSession(userId: string, sessionId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    MANAGER_DEVICE_KEY,
    JSON.stringify({ userId, sessionId }),
  );
}

export function clearManagerDeviceSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MANAGER_DEVICE_KEY);
}

export async function claimManagerSessionApi(
  accessToken: string,
): Promise<ManagerDeviceSession | null> {
  const res = await fetch("/api/manager/session", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { userId?: string; sessionId?: string };
  if (!data.userId || !data.sessionId) return null;
  writeManagerDeviceSession(data.userId, data.sessionId);
  return { userId: data.userId, sessionId: data.sessionId };
}

export async function validateManagerSessionApi(
  accessToken: string,
  session: ManagerDeviceSession,
): Promise<boolean> {
  const res = await fetch("/api/manager/session", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Manager-Session-Id": session.sessionId,
    },
  });
  return res.ok;
}

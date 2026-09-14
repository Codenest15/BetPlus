/** In-memory active manager session per user (one device). Resets on server restart. */

declare global {
  // eslint-disable-next-line no-var
  var betplusManagerSessions: Map<string, string> | undefined;
}

function sessionMap(): Map<string, string> {
  if (!globalThis.betplusManagerSessions) {
    globalThis.betplusManagerSessions = new Map();
  }
  return globalThis.betplusManagerSessions;
}

export function issueManagerSession(userId: string): string {
  const sessionId = crypto.randomUUID();
  sessionMap().set(userId, sessionId);
  return sessionId;
}

export function validateManagerSession(
  userId: string,
  sessionId: string,
): boolean {
  return sessionMap().get(userId) === sessionId;
}

export function clearManagerSession(userId: string): void {
  sessionMap().delete(userId);
}

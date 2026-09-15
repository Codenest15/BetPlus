import { managerDeviceSessionValid } from "./auth-store";
import { getAccessToken } from "./backend-client";
import {
  claimManagerSessionApi,
  clearManagerDeviceSession,
  readManagerDeviceSession,
  validateManagerSessionApi,
} from "./manager-session";
import type { User } from "./user-types";

/** Call right after a successful manager login (backend mode). */
export async function claimManagerSessionForUser(
  user: User,
  accessToken: string,
): Promise<void> {
  if (!user.isManager) {
    clearManagerDeviceSession();
    return;
  }
  await claimManagerSessionApi(accessToken);
}

export async function isManagerSessionValid(
  user: User,
  backendMode: boolean,
): Promise<boolean> {
  if (!user.isManager) return true;

  if (!backendMode) {
    return managerDeviceSessionValid(user.id);
  }

  const token = getAccessToken();
  const device = readManagerDeviceSession();
  if (!token || !device || device.userId !== user.id) {
    return false;
  }
  return validateManagerSessionApi(token, device);
}

const TOKEN_KEY = "betplus_access_token";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return getToken();
}

async function parseJson(resp: Response): Promise<unknown> {
  const text = await resp.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const resp = await fetch(path, { ...options, headers });
  const data = await parseJson(resp);

  if (!resp.ok) {
    const detail =
      typeof data === "object" && data && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : resp.statusText;
    throw new ApiError(detail || "Request failed", resp.status, data);
  }

  return data as T;
}

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  balance: number;
  is_admin: boolean;
  is_manager: boolean;
  referral_code: string | null;
  referred_by_manager_id: string | null;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export async function registerUser(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  referralCode?: string;
}): Promise<BackendUser> {
  return apiRequest<BackendUser>("/api/v1/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: input.password,
      referral_code: input.referralCode,
    }),
  });
}

export async function loginUser(input: {
  identifier: string;
  password: string;
}): Promise<TokenResponse> {
  const data = new URLSearchParams();
  data.append("username", input.identifier);
  data.append("password", input.password);
  return apiRequest<TokenResponse>("/api/v1/auth/login", {
    method: "POST",
    auth: false,
    body: data,
  });
}

export async function fetchCurrentUser(): Promise<BackendUser> {
  return apiRequest<BackendUser>("/api/v1/auth/me");
}

export async function deposit(amount: number, description = "") {
  return apiRequest("/api/v1/wallet/deposit", {
    method: "POST",
    body: JSON.stringify({ amount, description }),
  });
}

export async function withdraw(amount: number, description = "") {
  return apiRequest("/api/v1/wallet/withdraw", {
    method: "POST",
    body: JSON.stringify({ amount, description }),
  });
}

export async function getSports() {
  return apiRequest("/api/v1/catalog/sports", { auth: false });
}

export async function placeBet(input: {
  stake: number;
  selections: Array<{
    match_id: string;
    home_team: string;
    away_team: string;
    selection: string;
    selection_label: string;
    odds: number;
    league?: string;
    market_id?: string;
    market_name?: string;
  }>;
  flex_cut?: number;
}) {
  return apiRequest("/api/v1/bets/place", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getMyBets() {
  return apiRequest("/api/v1/bets/my");
}

export async function getBetByCode(code: string) {
  return apiRequest(`/api/v1/bets/code/${encodeURIComponent(code)}`, { auth: false });
}

export function useBackendApi(): boolean {
  return process.env.NEXT_PUBLIC_USE_BACKEND === "true";
}

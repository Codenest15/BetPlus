import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  getAdminCredentials,
  verifyAdminPhoneLogin,
} from "@/lib/admin-auth.server";
import { loginUsernameVariants } from "@/lib/phone-countries";
import { isStaffPhoneLogin } from "@/lib/staff-config";

async function tryFastApiAdminLogin(
  username: string,
  password: string,
): Promise<string | null> {
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
  try {
    const data = new URLSearchParams();
    data.append("username", username);
    data.append("password", password);
    const login = await fetch(`${backendUrl}/api/v1/auth/login`, {
      method: "POST",
      body: data,
    });
    if (!login.ok) return null;
    const token = (await login.json()) as { access_token?: string };
    if (!token.access_token) return null;
    const me = await fetch(`${backendUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!me.ok) return null;
    const user = (await me.json()) as { is_admin?: boolean };
    if (!user.is_admin) return null;
    return token.access_token;
  } catch {
    return null;
  }
}

async function tryFastApiLogin(
  username: string,
  password: string,
): Promise<string | null> {
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
  try {
    const data = new URLSearchParams();
    data.append("username", username);
    data.append("password", password);
    const login = await fetch(`${backendUrl}/api/v1/auth/login`, {
      method: "POST",
      body: data,
    });
    if (!login.ok) return null;
    const token = (await login.json()) as { access_token?: string };
    return token.access_token ?? null;
  } catch {
    return null;
  }
}

async function tryFastApiAdmin(
  phoneCountry: string,
  phone: string,
  password: string,
): Promise<string | null> {
  const { email } = getAdminCredentials();
  const usernames = loginUsernameVariants(phoneCountry, phone, email ? [email] : []);

  for (const username of usernames) {
    const token = await tryFastApiAdminLogin(username, password);
    if (token) return token;
  }

  if (!isStaffPhoneLogin(phoneCountry, phone, password)) {
    return null;
  }

  for (const username of usernames) {
    const token = await tryFastApiLogin(username, password);
    if (token) return token;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      phoneCountry?: string;
      phone?: string;
      password?: string;
    };
    const phoneCountry = body.phoneCountry?.trim() || "GH";
    const phone = body.phone?.trim() ?? "";
    const password = body.password ?? "";

    if (!phone || !password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const accessToken = await tryFastApiAdmin(phoneCountry, phone, password);
    const envOk = verifyAdminPhoneLogin(phoneCountry, phone, password);

    if (!accessToken && !envOk) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    if (accessToken) {
      response.cookies.set("betplus_access_token", accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    }
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import {
  clearManagerSession,
  issueManagerSession,
  validateManagerSession,
} from "@/lib/manager-session.server";
import { userPhoneIsStaff } from "@/lib/staff-config";

async function fetchBackendUser(accessToken: string) {
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
  const me = await fetch(`${backendUrl}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!me.ok) return null;
  return (await me.json()) as {
    id: string;
    is_manager?: boolean;
    is_admin?: boolean;
    phone?: string | null;
  };
}

function isManagerAccount(user: {
  is_manager?: boolean;
  phone?: string | null;
}): boolean {
  if (user.is_manager) return true;
  return userPhoneIsStaff(user.phone ?? "");
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await fetchBackendUser(token);
  if (!user || !isManagerAccount(user)) {
    return NextResponse.json({ error: "Not a manager" }, { status: 403 });
  }

  const sessionId = issueManagerSession(user.id);
  return NextResponse.json({ userId: user.id, sessionId });
}

export async function GET(request: Request) {
  const token = bearerToken(request);
  const sessionId = request.headers.get("x-manager-session-id")?.trim();
  if (!token || !sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await fetchBackendUser(token);
  if (!user || !isManagerAccount(user)) {
    return NextResponse.json({ error: "Not a manager" }, { status: 403 });
  }

  if (!validateManagerSession(user.id, sessionId)) {
    return NextResponse.json(
      { error: "Session replaced on another device" },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const token = bearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await fetchBackendUser(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  clearManagerSession(user.id);
  return NextResponse.json({ ok: true });
}

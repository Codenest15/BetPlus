import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** When ADMIN_ONLY=true (npm run dev:admin), only admin routes are reachable. */
export function middleware(request: NextRequest) {
  if (process.env.ADMIN_ONLY !== "true") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/bet/") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/brand/")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

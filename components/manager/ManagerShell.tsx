"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

const NAV: { href: string; label: string; exact?: boolean }[] = [
  { href: "/manager", label: "Dashboard", exact: true },
  { href: "/manager/matches", label: "Matches" },
  { href: "/manager/activity", label: "Activity" },
];

function isNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ManagerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { setManagerMode } = useAuth();

  return (
    <div className="min-h-screen bg-brand-light">
      <header className="sticky top-0 z-30 border-b border-brand/20 bg-brand-dark text-white">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/manager" className="shrink-0 text-sm font-bold">
            BetPlus Manager
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => {
              const active = isNavActive(pathname ?? "", item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "bg-white/15 text-white"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-md border border-white/20 px-2.5 py-1 text-[11px] font-medium text-white/85 hover:bg-white/10 sm:inline-block"
            >
              Sports
            </Link>
            <button
              type="button"
              onClick={() => setManagerMode(false)}
              className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-medium hover:bg-white/15"
            >
              Exit mode
            </button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-4 py-2 sm:hidden">
          {NAV.map((item) => {
            const active = isNavActive(pathname ?? "", item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${
                  active
                    ? "bg-brand-accent text-brand-dark"
                    : "bg-white/10 text-white/80"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-[11px] font-medium text-white/85"
          >
            Sports
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { adminLogout, isAdminLoggedIn } from "@/lib/admin-store";
import { seedUser1DemoSlip } from "@/lib/demo-seed";

export function AdminGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    seedUser1DemoSlip();
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-dark text-sm text-white/70">
        Loading admin…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light">
      <header className="border-b border-brand/20 bg-brand-dark text-white">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
          <Link href="/admin" className="text-sm font-bold">
            BetPlus Admin
          </Link>
          <nav className="flex items-center gap-3 text-xs">
            <Link href="/admin" className="text-white/80 hover:text-white">
              Dashboard
            </Link>
            <Link href="/admin/users" className="text-white/80 hover:text-white">
              Users
            </Link>
            <Link href="/admin/bets" className="text-white/80 hover:text-white">
              Bets
            </Link>
            <Link href="/admin/audit" className="text-white/80 hover:text-white">
              Audit
            </Link>
            <button
              type="button"
              onClick={() => {
                adminLogout();
                router.push("/admin/login");
              }}
              className="rounded bg-white/10 px-2 py-1 hover:bg-white/15"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
    </div>
  );
}

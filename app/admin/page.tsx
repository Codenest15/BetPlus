"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { DemoSeedPanel } from "@/components/admin/DemoSeedPanel";
import { getAdminAuditLog } from "@/lib/admin-store";
import { getAllBets } from "@/lib/bet-store";
import { getAllUsers } from "@/lib/auth-store";
import { getPlatformStats, getPlatformLedger } from "@/lib/platform-store";
import { seedUser1DemoSlip } from "@/lib/demo-seed";
import type { PlacedBet } from "@/lib/bet-types";
import type { User } from "@/lib/user-types";
import { formatMoney } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    users: 0,
    bets: 0,
    open: 0,
    totalBalance: 0,
    platformBalance: 0,
    netPosition: 0,
  });
  const [demo, setDemo] = useState<{
    user: User;
    bet: PlacedBet;
    created: boolean;
  } | null>(null);

  function reload() {
    setDemo(seedUser1DemoSlip());
    const users = getAllUsers();
    const bets = getAllBets();
    const userLiabilities = users.reduce((s, u) => s + u.balance, 0);
    const platform = getPlatformStats(userLiabilities);
    setStats({
      users: users.length,
      bets: bets.length,
      open: bets.filter((b) => b.status === "open").length,
      totalBalance: userLiabilities,
      platformBalance: platform.platformBalance,
      netPosition: platform.netPosition,
    });
  }

  useEffect(() => {
    reload();
  }, []);

  const recentAudit = getAdminAuditLog().slice(0, 5);
  const platformLedger = getPlatformLedger().slice(0, 8);

  return (
    <AdminGate>
      <div className="space-y-5">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-xs text-muted">Platform overview</p>
        </div>

        <DemoSeedPanel demo={demo} onReload={reload} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Platform balance (admin)", value: formatMoney(stats.platformBalance) },
            { label: "User wallets (liabilities)", value: formatMoney(stats.totalBalance) },
            { label: "Net house position", value: formatMoney(stats.netPosition) },
            { label: "Users", value: String(stats.users) },
            { label: "Total bets", value: String(stats.bets) },
            { label: "Open bets", value: String(stats.open) },
          ].map((item) => (
            <div key={item.label} className="card p-3">
              <p className="text-[11px] text-muted">{item.label}</p>
              <p className="mt-1 text-xl font-semibold text-brand-dark">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="card p-3">
            <h2 className="section-label mb-2">Platform ledger</h2>
            {platformLedger.length === 0 ? (
              <p className="text-xs text-muted">No platform movements yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {platformLedger.map((entry) => (
                  <li key={entry.id} className="text-[11px]">
                    <span className="font-medium">{entry.description}</span>
                    <span
                      className={
                        entry.amount >= 0 ? " text-accent" : " text-live"
                      }
                    >
                      {" "}
                      {entry.amount >= 0 ? "+" : ""}
                      {formatMoney(entry.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-3">
            <h2 className="section-label mb-2">Quick actions</h2>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/users"
                className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white"
              >
                Manage users
              </Link>
              <Link
                href="/admin/bets"
                className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand"
              >
                Manage bets
              </Link>
              {demo && (
                <Link
                  href={`/admin/bets/${demo.bet.id}`}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted"
                >
                  Edit User1 slip
                </Link>
              )}
            </div>
          </section>

          <section className="card p-3">
            <h2 className="section-label mb-2">Recent admin actions</h2>
            {recentAudit.length === 0 ? (
              <p className="text-xs text-muted">No actions logged yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {recentAudit.map((entry) => (
                  <li key={entry.id} className="text-[11px]">
                    <span className="font-medium text-foreground">{entry.action}</span>
                    <span className="text-muted"> — {entry.detail}</span>
                    {entry.bookingCode && (
                      <span className="text-muted"> ({entry.bookingCode})</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AdminGate>
  );
}

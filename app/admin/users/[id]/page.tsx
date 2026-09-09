"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { getUserById, grantFreeBetBalance, setUserBalance, setUserManagerRole } from "@/lib/auth-store";
import { getBetsByUser, getTransactionsByUser } from "@/lib/bet-store";
import { logAdminAction } from "@/lib/admin-store";
import type { PlacedBet } from "@/lib/bet-types";
import type { User } from "@/lib/user-types";
import { formatMoney } from "@/lib/utils";

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [balanceInput, setBalanceInput] = useState("");
  const [freeBetInput, setFreeBetInput] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const u = getUserById(userId);
    setUser(u);
    if (u) {
      setBalanceInput(String(u.balance));
      setBets(getBetsByUser(userId));
    }
  }, [userId]);

  function handleSetBalance(e: React.FormEvent) {
    e.preventDefault();
    const balance = Number.parseFloat(balanceInput);
    if (!Number.isFinite(balance) || balance < 0) {
      setMessage("Enter a valid balance");
      return;
    }

    const result = setUserBalance(userId, balance);
    if ("error" in result) {
      setMessage(result.error);
      return;
    }

    logAdminAction(
      "Set balance",
      `${result.user.email} → ${formatMoney(balance)}`,
    );
    setUser(result.user);
    setMessage("Balance updated");
  }

  function handleGrantFreeBet(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number.parseFloat(freeBetInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Enter a valid free bet amount");
      return;
    }

    const result = grantFreeBetBalance(userId, amount);
    if ("error" in result) {
      setMessage(result.error);
      return;
    }

    logAdminAction(
      "Grant free bet",
      `${result.user.email} → +${formatMoney(amount)} (total ${formatMoney(result.user.freeBetBalance ?? 0)})`,
    );
    setUser(result.user);
    setFreeBetInput("");
    setMessage("Free bet reward granted");
  }

  function handleToggleManager() {
    if (!user) return;
    const next = !user.isManager;
    const result = setUserManagerRole(userId, next);
    if ("error" in result) {
      setMessage(result.error);
      return;
    }
    logAdminAction(
      next ? "Grant manager" : "Revoke manager",
      `${result.user.email} → ${next ? "manager" : "user only"}`,
    );
    setUser(result.user);
    setMessage(
      next
        ? `${result.user.name} is now a manager — Manager tab will show in their app.`
        : `Manager access removed for ${result.user.name}.`,
    );
  }

  if (!user) {
    return (
      <AdminGate>
        <p className="text-sm text-muted">User not found.</p>
        <Link href="/admin/users" className="mt-2 inline-block text-xs text-brand">
          ← Back to users
        </Link>
      </AdminGate>
    );
  }

  const transactions = getTransactionsByUser(userId);

  return (
    <AdminGate>
      <div className="space-y-4">
        <Link href="/admin/users" className="text-xs text-brand hover:underline">
          ← Users
        </Link>

        <div>
          <h1 className="page-title">{user.name}</h1>
          <p className="text-xs text-muted">
            {user.email} · {user.phone}
            {user.isManager && (
              <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                Manager
              </span>
            )}
          </p>
        </div>

        {message && (
          <p className="rounded-md border border-brand/20 bg-brand/5 px-3 py-2 text-xs">
            {message}
          </p>
        )}

        <form onSubmit={handleSetBalance} className="card flex flex-wrap items-end gap-3 p-3">
          <label className="block">
            <span className="mb-1 block text-[11px] text-muted">Set balance</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              className="w-40 rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-brand px-3 py-2 text-xs font-medium text-white"
          >
            Save balance
          </button>
        </form>

        <form onSubmit={handleGrantFreeBet} className="card flex flex-wrap items-end gap-3 p-3">
          <div>
            <p className="text-[11px] text-muted">
              Free bet balance: {formatMoney(user.freeBetBalance ?? 0)}
            </p>
            <label className="mt-2 block">
              <span className="mb-1 block text-[11px] text-muted">
                Grant free bet reward (consistency bonus)
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={freeBetInput}
                onChange={(e) => setFreeBetInput(e.target.value)}
                placeholder="e.g. 10"
                className="w-40 rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </label>
          </div>
          <button
            type="submit"
            className="rounded-md bg-brand-accent px-3 py-2 text-xs font-semibold text-brand-dark"
          >
            Add free bet
          </button>
        </form>

        <section className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <h2 className="text-sm font-semibold text-brand-dark">Manager role</h2>
            <p className="mt-1 text-xs text-muted">
              Managers use the same login as users. They get a Manager tab in the
              footer to update match results.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleManager}
            className={`rounded-md px-4 py-2 text-xs font-semibold ${
              user.isManager
                ? "border border-live/40 text-live"
                : "bg-brand text-white"
            }`}
          >
            {user.isManager ? "Remove manager access" : "Register as manager"}
          </button>
        </section>

        <section className="card p-3">
          <h2 className="section-label mb-2">Bets ({bets.length})</h2>
          {bets.length === 0 ? (
            <p className="text-xs text-muted">No bets.</p>
          ) : (
            <ul className="space-y-2">
              {bets.map((bet) => (
                <li
                  key={bet.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2 text-xs last:border-0"
                >
                  <div>
                    <span className="font-medium">{bet.bookingCode}</span>
                    <span className="text-muted"> · {bet.status}</span>
                    <span className="text-muted"> · {formatMoney(bet.stake)}</span>
                  </div>
                  <Link href={`/admin/bets/${bet.id}`} className="text-brand hover:underline">
                    Edit
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-3">
          <h2 className="section-label mb-2">Transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-xs text-muted">No transactions.</p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {transactions.slice(0, 20).map((tx) => (
                <li key={tx.id} className="flex justify-between gap-2">
                  <span>{tx.description}</span>
                  <span className={tx.amount >= 0 ? "text-accent" : "text-live"}>
                    {tx.amount >= 0 ? "+" : ""}
                    {formatMoney(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminGate>
  );
}

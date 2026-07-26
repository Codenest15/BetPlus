"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { addTransaction, getTransactionsByUser } from "@/lib/bet-store";
import { updateUserBalance } from "@/lib/auth-store";
import { CURRENCY_SYMBOL, formatMoney } from "@/lib/utils";

const DEPOSIT_AMOUNTS = [20, 50, 100, 200, 500];
const WITHDRAW_AMOUNTS = [20, 50, 100, 200];

export default function WalletPage() {
  const { user, openLogin, refreshUser } = useAuth();
  const [tab, setTab] = useState<"deposit" | "withdraw" | "history">("deposit");
  const [amount, setAmount] = useState(50);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="page-title">Wallet</h1>
          <p className="mt-0.5 text-xs text-muted">Balance & transactions</p>
        </div>
        <div className="card py-10 text-center text-xs text-muted">
          <p>Log in to manage your wallet</p>
          <button
            type="button"
            onClick={openLogin}
            className="mt-3 rounded-md bg-brand px-4 py-1.5 text-xs font-medium text-white"
          >
            Log in
          </button>
        </div>
      </div>
    );
  }

  const transactions = getTransactionsByUser(user.id);
  const userId = user.id;
  const balance = user.balance;

  function handleDeposit() {
    setError("");
    setMessage("");
    if (amount < 1) {
      setError("Minimum deposit is GH₵1");
      return;
    }
    const result = updateUserBalance(userId, amount);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    addTransaction({
      userId,
      type: "deposit",
      amount,
      description: "Mobile money deposit",
    });
    refreshUser();
    setMessage(`Deposited ${formatMoney(amount)} successfully`);
  }

  function handleWithdraw() {
    setError("");
    setMessage("");
    if (amount < 1) {
      setError("Minimum withdrawal is GH₵1");
      return;
    }
    if (amount > balance) {
      setError("Insufficient balance");
      return;
    }
    const result = updateUserBalance(userId, -amount);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    addTransaction({
      userId,
      type: "withdraw",
      amount: -amount,
      description: "Withdrawal to mobile money",
    });
    refreshUser();
    setMessage(`Withdrawal of ${formatMoney(amount)} submitted`);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Wallet</h1>
        <p className="mt-0.5 text-xs text-muted">Balance & transactions</p>
      </div>

      <div className="card p-3">
        <p className="text-[11px] text-muted">Available</p>
        <p className="mt-0.5 text-2xl font-semibold text-brand">
          {formatMoney(user.balance)}
        </p>
      </div>

      <div className="card flex gap-0.5 p-0.5">
        {(["deposit", "withdraw", "history"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setMessage("");
              setError("");
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-colors ${
              tab === t
                ? "bg-brand-dark text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab !== "history" && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {(tab === "deposit" ? DEPOSIT_AMOUNTS : WITHDRAW_AMOUNTS).map(
              (a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                    amount === a
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border/80 text-muted"
                  }`}
                >
                  {CURRENCY_SYMBOL}
                  {a}
                </button>
              ),
            )}
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] text-muted">
              Amount ({CURRENCY_SYMBOL})
            </span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full rounded-md border border-border/80 bg-surface-elevated px-3 py-2 text-sm font-medium outline-none focus:border-brand"
            />
          </label>

          {error && <p className="text-xs text-live">{error}</p>}
          {message && <p className="text-xs text-brand">{message}</p>}

          <button
            type="button"
            onClick={tab === "deposit" ? handleDeposit : handleWithdraw}
            className="w-full rounded-md bg-brand py-2 text-xs font-medium text-white hover:bg-brand-dark"
          >
            {tab === "deposit" ? "Deposit" : "Withdraw"}
          </button>
        </>
      )}

      {tab === "history" && (
        <ul className="card divide-y divide-border/60 overflow-hidden">
          {transactions.length === 0 ? (
            <li className="py-6 text-center text-xs text-muted">No transactions</li>
          ) : (
            transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-[10px] text-muted">
                    {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    tx.amount >= 0 ? "text-brand" : "text-foreground"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {formatMoney(Math.abs(tx.amount))}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { PasswordField } from "@/components/auth/PasswordField";
import { PhoneCountryInput } from "@/components/auth/PhoneCountryInput";
import { useAuth } from "@/lib/auth-context";
import type { User } from "@/lib/user-types";

export function ManagerLoginPanel({
  user,
  sessionNotice,
  onDismissNotice,
}: {
  user: User | null;
  sessionNotice?: string | null;
  onDismissNotice?: () => void;
}) {
  const { login, logout } = useAuth();
  const [phoneCountry, setPhoneCountry] = useState("GH");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await login(phoneCountry, phone, password);
    if (result) setError(result);
    setSubmitting(false);
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="card p-6">
        <h1 className="text-lg font-bold text-brand-dark">Manager login</h1>
        <p className="mt-1 text-xs text-muted">
          Sign in with your mobile number and password. Only accounts assigned as
          managers by an admin can use these tools. One active device at a time.
        </p>

        {sessionNotice && (
          <div className="mt-4 rounded-md border border-live/30 bg-live-soft px-3 py-2 text-xs text-live">
            {sessionNotice}
            {onDismissNotice && (
              <button
                type="button"
                onClick={onDismissNotice}
                className="ml-2 font-semibold underline"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {user && !user.isManager && (
          <div className="mt-4 rounded-md border border-border bg-brand-light/40 px-3 py-2 text-xs text-muted">
            You&apos;re signed in as <strong className="text-brand-dark">{user.name}</strong>
            {user.email ? ` (${user.email})` : ""}. That account is not a manager — sign
            in below with an authorized number, or{" "}
            <button
              type="button"
              onClick={() => logout()}
              className="font-semibold text-brand hover:underline"
            >
              log out
            </button>{" "}
            first.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <PhoneCountryInput
            countryId={phoneCountry}
            onCountryChange={setPhoneCountry}
            phone={phone}
            onPhoneChange={setPhone}
          />
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            required
          />
          {error && <p className="text-sm text-live">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-dark py-3 text-sm font-bold text-white hover:bg-brand disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <Link
          href="/"
          className="mt-4 block text-center text-xs font-medium text-brand hover:underline"
        >
          Back to Sports
        </Link>
      </div>
    </div>
  );
}

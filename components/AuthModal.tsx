"use client";

import { useEffect, useState } from "react";
import { PasswordField } from "@/components/auth/PasswordField";
import { PhoneCountryInput } from "@/components/auth/PhoneCountryInput";
import { useAuth } from "@/lib/auth-context";
import { deferEffect } from "@/lib/defer-effect";
import {
  findManagerByReferralCode,
  getPendingReferralCode,
  setPendingReferralCode,
} from "@/lib/referral-store";

export function AuthModal() {
  const { authModal, closeAuthModal, login, register, openLogin, openRegister } =
    useAuth();

  if (!authModal) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close"
        onClick={closeAuthModal}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl sm:rounded-2xl"
      >
        <div className="h-1 bg-gradient-to-r from-brand-dark via-brand to-brand-accent" />
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-4 top-4 text-muted hover:text-foreground"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {authModal === "login" ? (
          <LoginForm
            onSubmit={login}
            onSwitch={() => {
              closeAuthModal();
              openRegister();
            }}
          />
        ) : (
          <RegisterForm
            onSubmit={register}
            onSwitch={() => {
              closeAuthModal();
              openLogin();
            }}
          />
        )}
      </div>
    </div>
  );
}

function LoginForm({
  onSubmit,
  onSwitch,
}: {
  onSubmit: (
    phoneCountry: string,
    phone: string,
    password: string,
  ) => Promise<string | null>;
  onSwitch: () => void;
}) {
  const [phoneCountry, setPhoneCountry] = useState("GH");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await onSubmit(phoneCountry, phone, password);
    setError(result ?? "");
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-8">
      <div>
        <h2 id="auth-modal-title" className="text-xl font-bold">Log In</h2>
        <p className="mt-1 text-sm text-muted">Sign in with your mobile number</p>
      </div>

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
        placeholder="Your password"
        required
      />

      {error && <p className="text-sm text-live">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-dark py-3 text-sm font-bold text-white hover:bg-brand disabled:opacity-60"
      >
        {submitting ? "Logging in…" : "Log In"}
      </button>

      <p className="text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-brand">
          Register
        </button>
      </p>
    </form>
  );
}

function RegisterForm({
  onSubmit,
  onSwitch,
}: {
  onSubmit: (input: {
    name: string;
    email: string;
    phone: string;
    phoneCountry: string;
    password: string;
    referralCode?: string;
  }) => Promise<string | null>;
  onSwitch: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("GH");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  useEffect(() => {
    return deferEffect(() => {
      const pending = getPendingReferralCode();
      if (pending) setReferralCode(pending);
    });
  }, []);

  useEffect(() => {
    return deferEffect(() => {
      const code = referralCode.trim();
      if (!code) {
        setReferrerName(null);
        return;
      }
      const manager = findManagerByReferralCode(code);
      setReferrerName(manager?.name ?? null);
    });
  }, [referralCode]);

  function handleReferralCodeChange(value: string) {
    const next = value.toUpperCase();
    setReferralCode(next);
    if (next.trim()) setPendingReferralCode(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone,
      phoneCountry,
      password,
      referralCode: referralCode.trim() || undefined,
    });
    setError(result ?? "");
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-8">
      <div>
        <h2 id="auth-modal-title" className="text-xl font-bold">Create Account</h2>
        <p className="mt-1 text-sm text-muted">
          Register with your details — you will log in with phone and password only
        </p>
        {referrerName && (
          <p className="mt-2 rounded-md bg-brand-light px-3 py-2 text-xs text-brand-dark">
            Referred by <strong>{referrerName}</strong>. Your account will be
            linked to their invitation only.
          </p>
        )}
        {referralCode.trim() && !referrerName && (
          <p className="mt-2 rounded-md bg-live-soft px-3 py-2 text-xs text-live">
            Referral code not recognized. Check the code from your manager.
          </p>
        )}
      </div>

      <Field
        label="Referral code (optional)"
        name="referralCode"
        value={referralCode}
        onChange={handleReferralCodeChange}
        placeholder="Enter manager code e.g. JOHN1A2B"
        autoComplete="off"
      />

      <Field
        label="Full name"
        name="name"
        autoComplete="name"
        value={name}
        onChange={setName}
        placeholder="John Doe"
        required
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        placeholder="you@email.com"
        required
      />
      <PhoneCountryInput
        countryId={phoneCountry}
        onCountryChange={setPhoneCountry}
        phone={phone}
        onPhoneChange={setPhone}
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        placeholder="Choose a password"
        required
      />

      {error && <p className="text-sm text-live">{error}</p>}

      <button
        type="submit"
        data-testid="register-submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-accent py-3 text-sm font-bold text-brand-dark hover:brightness-95 disabled:opacity-60"
      >
        {submitting ? "Creating account…" : "Register"}
      </button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-brand">
          Log In
        </button>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  autoComplete,
}: {
  label: string;
  name?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
    </label>
  );
}

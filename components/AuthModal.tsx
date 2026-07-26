"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

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
      <div className="relative w-full max-w-md overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl sm:rounded-2xl">
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
  onSubmit: (identifier: string, password: string) => string | null;
  onSwitch: () => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(onSubmit(identifier, password) ?? "");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-8">
      <div>
        <h2 className="text-xl font-bold">Log In</h2>
        <p className="mt-1 text-sm text-muted">Welcome back to BetPlus</p>
      </div>

      <Field
        label="Email or phone"
        value={identifier}
        onChange={setIdentifier}
        placeholder="you@email.com or 08012345678"
        required
      />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Your password"
        required
      />

      {error && <p className="text-sm text-live">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-lg bg-brand-dark py-3 text-sm font-bold text-white hover:bg-brand"
      >
        Log In
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
    password: string;
  }) => string | null;
  onSwitch: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(onSubmit({ name, email, phone, password }) ?? "");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-8">
      <div>
        <h2 className="text-xl font-bold">Create Account</h2>
        <p className="mt-1 text-sm text-muted">Join BetPlus — get GH₵50 welcome balance</p>
      </div>

      <Field label="Full name" value={name} onChange={setName} placeholder="John Doe" required />
      <Field
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@email.com"
        required
      />
      <Field
        label="Phone"
        type="tel"
        value={phone}
        onChange={setPhone}
        placeholder="08012345678"
        required
      />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Min. 6 characters"
        required
      />

      {error && <p className="text-sm text-live">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-lg bg-brand-accent py-3 text-sm font-bold text-brand-dark hover:brightness-95"
      >
        Register
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
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
    </label>
  );
}

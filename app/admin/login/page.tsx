"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminLogin, DEFAULT_ADMIN } from "@/lib/admin-store";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEFAULT_ADMIN.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (adminLogin(email, password)) {
      router.push("/admin");
    } else {
      setError("Invalid admin credentials");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-brand/30 bg-white p-5 shadow-lg"
      >
        <h1 className="text-lg font-bold text-brand-dark">Admin login</h1>
        <p className="mt-1 text-xs text-muted">
          Separate from user accounts. Operations are logged.
        </p>

        <label className="mt-4 block">
          <span className="mb-1 block text-[11px] text-muted">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1 block text-[11px] text-muted">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        {error && <p className="mt-2 text-xs text-live">{error}</p>}

        <button
          type="submit"
          className="mt-4 w-full rounded-md bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Sign in
        </button>

        <p className="mt-3 text-center text-[10px] text-muted">
          Demo: {DEFAULT_ADMIN.email} / {DEFAULT_ADMIN.password}
        </p>
      </form>
    </div>
  );
}

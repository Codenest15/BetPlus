"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasswordField } from "@/components/auth/PasswordField";
import { PhoneCountryInput } from "@/components/auth/PhoneCountryInput";
import { adminLogin } from "@/lib/admin-store";

export default function AdminLoginPage() {
  const router = useRouter();
  const [phoneCountry, setPhoneCountry] = useState("GH");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await adminLogin(phoneCountry, phone, password);
    setLoading(false);
    if (ok) {
      router.push("/admin");
    } else {
      setError("Invalid phone number or password, or this account is not an admin.");
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
          Phone and password — only accounts marked admin in the database can sign in.
        </p>

        <div className="mt-4">
          <PhoneCountryInput
            countryId={phoneCountry}
            onCountryChange={setPhoneCountry}
            phone={phone}
            onPhoneChange={setPhone}
          />
        </div>

        <div className="mt-3">
          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="mt-2 text-xs text-live">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-md bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

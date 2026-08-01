"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

/** Manager uses the normal user login — admin grants the manager role. */
export default function ManagerLoginPage() {
  const router = useRouter();
  const { user, isLoading, openLogin } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (user?.isManager) router.replace("/manager");
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted">Loading…</div>
    );
  }

  if (user?.isManager) {
    return null;
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 py-10">
      <div className="card p-5 text-center">
        <h1 className="page-title">Manager access</h1>
        <p className="mt-2 text-xs text-muted">
          Log in with your normal BetPlus account. If an admin registered you as
          a manager, open <strong className="text-brand-dark">Me</strong> →{" "}
          <strong className="text-brand-dark">Manager tools</strong>.
        </p>
        {!user ? (
          <button
            type="button"
            onClick={openLogin}
            className="mt-4 w-full rounded-md bg-brand py-2.5 text-sm font-semibold text-white"
          >
            Log in
          </button>
        ) : (
          <p className="mt-4 text-xs text-live">
            Your account is not a manager yet. Ask admin to register you under
            Users → Make manager.
          </p>
        )}
        <Link
          href="/"
          className="mt-3 inline-block text-xs text-brand hover:underline"
        >
          Back to Sports
        </Link>
      </div>
    </div>
  );
}

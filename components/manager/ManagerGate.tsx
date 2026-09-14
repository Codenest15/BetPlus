"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { MANAGER_SESSION_KICKED_EVENT } from "@/lib/manager-session";
import { ManagerLoginPanel } from "./ManagerLoginPanel";
import { ManagerShell } from "./ManagerShell";

/** Requires a logged-in manager with Manager Mode enabled in Profile. */
export function ManagerGate({ children }: { children: ReactNode }) {
  const { user, isLoading, refreshUser, canManage } = useAuth();
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    function onKicked() {
      setSessionNotice(
        "This manager account signed in on another device. Log in again here to use this device.",
      );
    }
    window.addEventListener(MANAGER_SESSION_KICKED_EVENT, onKicked);
    return () =>
      window.removeEventListener(MANAGER_SESSION_KICKED_EVENT, onKicked);
  }, []);

  useEffect(() => {
    if (!canManage) return;
    const id = window.setInterval(() => {
      void refreshUser();
    }, 45_000);
    return () => window.clearInterval(id);
  }, [canManage, refreshUser]);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (canManage) {
    return <ManagerShell>{children}</ManagerShell>;
  }

  if (user?.isManager) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="card py-10 text-center">
          <p className="text-sm font-medium text-brand-dark">Manager Mode is off</p>
          <p className="mt-2 text-xs text-muted">
            Turn on Manager Mode in your Profile settings to access match control
            and ticket editing tools.
          </p>
          <Link
            href="/account?open=profile"
            className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-xs font-semibold text-white"
          >
            Open Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ManagerLoginPanel
      user={user}
      sessionNotice={sessionNotice}
      onDismissNotice={() => setSessionNotice(null)}
    />
  );
}

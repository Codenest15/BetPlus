"use client";

import { useState } from "react";
import { AccountGuest } from "@/components/AccountGuest";
import { AccountProfile } from "@/components/AccountProfile";
import { PersonalSettings } from "@/components/PersonalSettings";
import { useAuth } from "@/lib/auth-context";

export default function AccountPage() {
  const { user, isLoading, logout } = useAuth();
  const [view, setView] = useState<"main" | "settings">("main");

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted">Loading account...</div>
    );
  }

  if (!user) {
    return <AccountGuest />;
  }

  if (view === "settings") {
    return <PersonalSettings onBack={() => setView("main")} />;
  }

  return (
    <AccountProfile
      user={user}
      onOpenSettings={() => setView("settings")}
      onLogout={logout}
    />
  );
}

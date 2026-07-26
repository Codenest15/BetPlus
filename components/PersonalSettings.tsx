"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function PersonalSettings({ onBack }: { onBack: () => void }) {
  const { user, settings, updateProfile, changePassword, saveSettings } =
    useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
    }
  }, [user]);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");

  if (!user) return null;

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileMsg("");
    const err = updateProfile({ name, email, phone });
    if (err) setProfileError(err);
    else setProfileMsg("Profile updated successfully.");
  }

  function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordMsg("");
    const err = changePassword(currentPassword, newPassword);
    if (err) setPasswordError(err);
    else {
      setPasswordMsg("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
      >
        ← Back to Account
      </button>

      <div>
        <h2 className="text-xl font-bold">Personal Settings</h2>
        <p className="mt-1 text-sm text-muted">Manage your profile and preferences</p>
      </div>

      <form
        onSubmit={handleProfileSave}
        className="space-y-4 rounded-xl border border-border bg-surface p-5"
      >
        <h3 className="font-semibold">Personal Details</h3>

        <SettingsField label="Full name" value={name} onChange={setName} />
        <SettingsField label="Email" type="email" value={email} onChange={setEmail} />
        <SettingsField label="Phone" type="tel" value={phone} onChange={setPhone} />

        {profileError && <p className="text-sm text-live">{profileError}</p>}
        {profileMsg && <p className="text-sm text-brand">{profileMsg}</p>}

        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Save Profile
        </button>
      </form>

      <form
        onSubmit={handlePasswordSave}
        className="space-y-4 rounded-xl border border-border bg-surface p-5"
      >
        <h3 className="font-semibold">Change Password</h3>

        <SettingsField
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={setCurrentPassword}
        />
        <SettingsField
          label="New password"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
        />

        {passwordError && <p className="text-sm text-live">{passwordError}</p>}
        {passwordMsg && <p className="text-sm text-brand">{passwordMsg}</p>}

        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:border-brand/50"
        >
          Update Password
        </button>
      </form>

      <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <h3 className="font-semibold">Preferences</h3>

        <label className="flex items-center justify-between">
          <span className="text-sm">Push notifications</span>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => saveSettings({ notifications: e.target.checked })}
            className="h-4 w-4 accent-brand"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Odds format</span>
          <select
            value={settings.oddsFormat}
            onChange={(e) =>
              saveSettings({
                oddsFormat: e.target.value as "decimal" | "fractional",
              })
            }
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            <option value="decimal">Decimal (2.50)</option>
            <option value="fractional">Fractional (3/2)</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function SettingsField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
    </label>
  );
}

"use client";

import { useState } from "react";

interface PasswordFieldProps {
  label: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

export function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength = 6,
  maxLength = 12,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <div className="relative">
        <input
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          className="w-full rounded-lg border border-border bg-surface-elevated py-2.5 pl-3 pr-10 text-sm outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M3 3l18 18M10.5 10.677a2.25 2.25 0 002.622 2.622M9.88 5.09A10.94 10.94 0 0112 5c5.523 0 10 4.477 10 10a10.05 10.05 0 01-4.906 8.59M6.228 6.228A10.05 10.05 0 002 15c0 5.523 4.477 10 10 10 2.042 0 3.93-.61 5.502-1.66" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      <p className="mt-1 text-[10px] text-muted">6–12 characters</p>
    </label>
  );
}

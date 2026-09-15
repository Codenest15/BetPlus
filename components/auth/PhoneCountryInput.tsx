"use client";

import {
  PHONE_COUNTRIES,
  getPhoneCountry,
  type PhoneCountry,
} from "@/lib/phone-countries";

interface PhoneCountryInputProps {
  countryId: string;
  onCountryChange: (id: string) => void;
  phone: string;
  onPhoneChange: (value: string) => void;
  required?: boolean;
}

export function PhoneCountryInput({
  countryId,
  onCountryChange,
  phone,
  onPhoneChange,
  required = true,
}: PhoneCountryInputProps) {
  const country = getPhoneCountry(countryId);

  return (
    <div className="space-y-1">
      <span className="block text-xs font-medium text-muted">Phone number</span>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="phone-country">
          Country
        </label>
        <select
          id="phone-country"
          value={countryId}
          onChange={(e) => onCountryChange(e.target.value)}
          className="w-[38%] shrink-0 rounded-lg border border-border bg-surface-elevated px-2 py-2.5 text-sm outline-none focus:border-brand"
        >
          {PHONE_COUNTRIES.map((c: PhoneCountry) => (
            <option key={c.id} value={c.id}>
              {c.label} {c.dial}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value.replace(/[^\d\s-]/g, ""))}
          placeholder={country.placeholder}
          required={required}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>
    </div>
  );
}

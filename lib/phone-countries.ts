export interface PhoneCountry {
  id: string;
  label: string;
  dial: string;
  placeholder: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { id: "GH", label: "Ghana", dial: "+233", placeholder: "541739307" },
  { id: "NG", label: "Nigeria", dial: "+234", placeholder: "8012345678" },
];

export function getPhoneCountry(id: string): PhoneCountry {
  return PHONE_COUNTRIES.find((c) => c.id === id) ?? PHONE_COUNTRIES[0];
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Local digits without leading 0 (e.g. 541739307). */
export function localPhoneDigits(local: string): string {
  let d = digitsOnly(local);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

/** Stored/display form with leading 0 for Ghana-style numbers. */
export function formatStoredPhone(countryId: string, local: string): string {
  const country = getPhoneCountry(countryId);
  const core = localPhoneDigits(local);
  if (!core) return "";
  if (country.id === "GH" || country.id === "NG") {
    return `0${core}`;
  }
  return `${country.dial}${core}`;
}

/** Match variants for login lookup. */
export function phoneLookupKeys(countryId: string, local: string): string[] {
  const country = getPhoneCountry(countryId);
  const core = localPhoneDigits(local);
  if (!core) return [];

  const keys = new Set<string>();
  keys.add(local.trim());
  keys.add(digitsOnly(local));
  keys.add(`0${core}`);
  keys.add(core);
  keys.add(`${country.dial}${core}`);
  keys.add(`+${country.dial.replace("+", "")}${core}`);
  return [...keys];
}

export function validatePasswordLength(password: string): string | null {
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (password.length > 12) return "Password must be at most 12 characters.";
  return null;
}

/** OAuth `username` values to try (DB may store any one format). */
export function loginUsernameVariants(
  countryId: string,
  local: string,
  extraUsernames: string[] = [],
): string[] {
  const keys = new Set<string>();
  for (const key of phoneLookupKeys(countryId, local)) keys.add(key);
  const stored = formatStoredPhone(countryId, local);
  if (stored) keys.add(stored);
  for (const extra of extraUsernames) {
    const trimmed = extra.trim();
    if (trimmed) keys.add(trimmed);
  }
  return [...keys];
}

export function phonesMatch(
  countryA: string,
  localA: string,
  countryB: string,
  localB: string,
): boolean {
  const keysA = new Set(phoneLookupKeys(countryA, localA));
  for (const key of phoneLookupKeys(countryB, localB)) {
    if (keysA.has(key)) return true;
  }
  return false;
}

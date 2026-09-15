import { phonesMatch } from "./phone-countries";

/** Owner account — only this phone gets env-based admin fallback (not new signups). */
export const STAFF_PHONE_COUNTRY = "GH";
export const STAFF_PHONE = "0541739307";
export const STAFF_PASSWORD = "87654321";
export const STAFF_EMAIL = "me@gmail.com";
export const STAFF_NAME = "BetPlus Staff";

export function getStaffPhone(): string {
  if (typeof process !== "undefined") {
    const fromEnv = process.env.ADMIN_PHONE?.trim() || process.env.STAFF_PHONE?.trim();
    if (fromEnv) return fromEnv;
  }
  return STAFF_PHONE;
}

export function getStaffPassword(): string {
  if (typeof process !== "undefined") {
    const fromEnv = process.env.ADMIN_PASSWORD ?? process.env.STAFF_PASSWORD;
    if (fromEnv) return fromEnv;
  }
  return STAFF_PASSWORD;
}

export function getStaffEmail(): string {
  if (typeof process !== "undefined") {
    const fromEnv = process.env.ADMIN_EMAIL?.trim() || process.env.STAFF_EMAIL?.trim();
    if (fromEnv) return fromEnv.toLowerCase();
  }
  return STAFF_EMAIL.toLowerCase();
}

export function getStaffName(): string {
  if (typeof process !== "undefined" && process.env.STAFF_NAME?.trim()) {
    return process.env.STAFF_NAME.trim();
  }
  return STAFF_NAME;
}

export function isStaffPhoneLogin(
  phoneCountry: string,
  phone: string,
  password: string,
): boolean {
  if (password !== getStaffPassword()) return false;
  return phonesMatch(phoneCountry, phone, STAFF_PHONE_COUNTRY, getStaffPhone());
}

export function userPhoneIsStaff(storedPhone: string): boolean {
  return phonesMatch(STAFF_PHONE_COUNTRY, storedPhone, STAFF_PHONE_COUNTRY, getStaffPhone());
}

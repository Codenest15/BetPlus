/** Server-only admin credentials — never import from client components. */

import {
  getStaffEmail,
  getStaffPassword,
  getStaffPhone,
  isStaffPhoneLogin,
} from "./staff-config";

export const ADMIN_SESSION_COOKIE = "betplus_admin_auth";

export function getAdminCredentials() {
  if (process.env.NODE_ENV === "production") {
    return {
      phone: (process.env.ADMIN_PHONE ?? process.env.STAFF_PHONE ?? "").trim(),
      password: process.env.ADMIN_PASSWORD ?? process.env.STAFF_PASSWORD ?? "",
      email: (process.env.ADMIN_EMAIL ?? process.env.STAFF_EMAIL ?? "")
        .trim()
        .toLowerCase(),
    };
  }

  return {
    phone: getStaffPhone(),
    password: getStaffPassword(),
    email: getStaffEmail(),
  };
}

export function verifyAdminPhoneLogin(
  phoneCountry: string,
  phone: string,
  password: string,
): boolean {
  if (process.env.NODE_ENV === "production") {
    const creds = getAdminCredentials();
    if (!creds.password || !creds.phone) return false;
    return isStaffPhoneLogin(phoneCountry, phone, password);
  }
  return isStaffPhoneLogin(phoneCountry, phone, password);
}

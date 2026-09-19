import type { MobileNetwork } from "./payment-methods";
import { digitsOnly } from "./phone-countries";

/** Moolre collection channel codes (see DEPLOY.md). */
export function momoNetworkToProviderChannel(network: MobileNetwork): string {
  switch (network) {
    case "mtn":
      return "MTN";
    case "telecel":
      return "TELECEL";
    case "airteltigo":
      return "AT";
    default:
      return "MTN";
  }
}

/** Ghana MoMo: local `0XXXXXXXXX` (10 digits). Accepts 233… or missing leading 0. */
export function normalizeGhanaMoMoPhone(input: string): string | null {
  let d = digitsOnly(input.trim());
  if (!d) return null;
  if (d.startsWith("233")) d = `0${d.slice(3)}`;
  else if (!d.startsWith("0") && d.length === 9) d = `0${d}`;
  if (!/^0\d{9}$/.test(d)) return null;
  return d;
}

const MTN_PREFIXES = new Set(["024", "025", "053", "054", "055", "059"]);
const TELECEL_PREFIXES = new Set(["020", "050"]);
const AT_PREFIXES = new Set(["026", "027", "056", "057"]);

export function inferGhanaMoMoNetwork(phone: string): MobileNetwork | null {
  const normalized = normalizeGhanaMoMoPhone(phone);
  if (!normalized) return null;
  const prefix = normalized.slice(0, 3);
  if (MTN_PREFIXES.has(prefix)) return "mtn";
  if (TELECEL_PREFIXES.has(prefix)) return "telecel";
  if (AT_PREFIXES.has(prefix)) return "airteltigo";
  return null;
}

export function validateGhanaMoMoForNetwork(
  phone: string,
  network: MobileNetwork,
): string | null {
  const normalized = normalizeGhanaMoMoPhone(phone);
  if (!normalized) {
    return "Enter a valid Ghana mobile money number (e.g. 054 123 4567).";
  }
  const inferred = inferGhanaMoMoNetwork(normalized);
  if (inferred && inferred !== network) {
    const labels: Record<MobileNetwork, string> = {
      mtn: "MTN",
      telecel: "Telecel",
      airteltigo: "AirtelTigo",
    };
    return `This number looks like ${labels[inferred]} — switch network or use the matching number.`;
  }
  return null;
}

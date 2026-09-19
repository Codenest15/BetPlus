import { digitsOnly } from "./phone-countries";

export const MIN_DEPOSIT_GHS = 1;
export const MIN_DEPOSIT_USD = 1;

export type WalletDepositMarket = "ghana" | "international";

const GH_QUICK_AMOUNTS = [1, 5, 10, 50, 100];
const INTL_QUICK_AMOUNTS = [1, 5, 10, 50, 100];

/** Ghana numbers vs Nigeria / other (USD minimum). */
export function walletDepositMarket(phone: string | undefined): WalletDepositMarket {
  const d = digitsOnly(phone ?? "");
  if (!d) return "ghana";
  if (d.startsWith("234")) return "international";
  if (d.startsWith("233")) return "ghana";
  if (d.startsWith("0")) {
    return d.length === 10 ? "ghana" : "international";
  }
  return "international";
}

export function minDepositAmount(market: WalletDepositMarket): number {
  return market === "ghana" ? MIN_DEPOSIT_GHS : MIN_DEPOSIT_USD;
}

export function depositQuickAmounts(market: WalletDepositMarket): number[] {
  const min = minDepositAmount(market);
  const list = market === "ghana" ? GH_QUICK_AMOUNTS : INTL_QUICK_AMOUNTS;
  return list.filter((a) => a >= min - 1e-9);
}

export function defaultDepositAmount(market: WalletDepositMarket): number {
  return minDepositAmount(market);
}

export function depositAmountSymbol(market: WalletDepositMarket): string {
  return market === "ghana" ? "GH₵" : "$";
}

export function validateDepositAmount(
  amount: number,
  market: WalletDepositMarket,
): string | null {
  if (!Number.isFinite(amount)) {
    return "Enter a valid amount.";
  }
  const min = minDepositAmount(market);
  if (amount + 1e-9 < min) {
    return market === "ghana"
      ? `Minimum deposit is GH₵${min.toFixed(2)}.`
      : `Minimum deposit is $${min.toFixed(2)}.`;
  }
  return null;
}

/** Parse free-typed amount field (empty → NaN). */
export function parseAmountInput(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return Number.NaN;
  return Number.parseFloat(trimmed);
}

export function formatAmountInputValue(amount: number): string {
  if (!Number.isFinite(amount)) return "";
  return String(amount);
}

export function formatDepositAmount(
  amount: number,
  market: WalletDepositMarket,
): string {
  const fractionDigits = amount < 1 ? 2 : amount % 1 === 0 ? 0 : 2;
  if (market === "ghana") {
    return `GH₵${amount.toLocaleString("en-GH", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: 2,
    })}`;
  }
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  })}`;
}

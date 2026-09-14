import { digitsOnly } from "./phone-countries";

export const MIN_DEPOSIT_GHS = 250;
export const MIN_DEPOSIT_USD = 20;

export type WalletDepositMarket = "ghana" | "international";

const GH_QUICK_AMOUNTS = [250, 500, 1000, 2000];
const INTL_QUICK_AMOUNTS = [20, 50, 100, 200];

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
  return list.filter((a) => a >= min);
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
  if (market === "ghana") {
    if (amount < min) {
      return `Minimum deposit is GH₵${min.toLocaleString("en-GH")}.`;
    }
    return null;
  }
  if (amount < min) {
    return `Minimum deposit is $${min}.`;
  }
  return null;
}

export function formatDepositAmount(
  amount: number,
  market: WalletDepositMarket,
): string {
  if (market === "ghana") {
    return `GH₵${amount.toLocaleString("en-GH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

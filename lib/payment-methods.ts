export type DepositMethod = "mobile-money" | "usdt" | "btc" | "visa";
export type WithdrawMethod = "mobile-money" | "usdt" | "btc" | "visa";
export type MobileNetwork = "mtn" | "telecel" | "airteltigo";
export type UsdtNetwork = "trc20" | "erc20";

export interface PaymentMethodOption {
  id: DepositMethod;
  label: string;
  description: string;
  badge?: string;
  icon?: string;
}

export const DEPOSIT_METHODS: PaymentMethodOption[] = [
  {
    id: "mobile-money",
    label: "Mobile Money",
    description: "MTN, Telecel, AirtelTigo",
    badge: "Local",
  },
  {
    id: "visa",
    label: "Visa Card",
    description: "Debit or credit card",
    badge: "Card",
    icon: "/icons/payments/visa.svg",
  },
  {
    id: "usdt",
    label: "USDT",
    description: "TRC20 or ERC20",
    badge: "Crypto",
    icon: "/icons/payments/usdt.png",
  },
  {
    id: "btc",
    label: "Bitcoin",
    description: "BTC on-chain",
    badge: "Crypto",
    icon: "/icons/payments/btc.png",
  },
];

export const WITHDRAW_METHODS: PaymentMethodOption[] = [
  {
    id: "mobile-money",
    label: "Mobile Money",
    description: "To your Ghana mobile wallet",
    badge: "Local",
  },
  {
    id: "visa",
    label: "Visa Card",
    description: "Refund to your card",
    badge: "Card",
    icon: "/icons/payments/visa.svg",
  },
  {
    id: "usdt",
    label: "USDT",
    description: "Send to your crypto wallet",
    badge: "Crypto",
    icon: "/icons/payments/usdt.png",
  },
  {
    id: "btc",
    label: "Bitcoin",
    description: "Send to your BTC address",
    badge: "Crypto",
    icon: "/icons/payments/btc.png",
  },
];

export const MOBILE_NETWORKS: {
  id: MobileNetwork;
  label: string;
  color: string;
}[] = [
  { id: "mtn", label: "MTN MoMo", color: "#ffcc00" },
  { id: "telecel", label: "Telecel Cash", color: "#e41827" },
  { id: "airteltigo", label: "AirtelTigo Money", color: "#005eb8" },
];

export const USDT_NETWORKS: { id: UsdtNetwork; label: string; fee: string }[] = [
  { id: "trc20", label: "TRC20", fee: "Low fee" },
  { id: "erc20", label: "ERC20", fee: "Standard" },
];

export function mobileNetworkLabel(id: MobileNetwork) {
  return MOBILE_NETWORKS.find((n) => n.id === id)?.label ?? id;
}

export function depositMethodLabel(id: DepositMethod) {
  return DEPOSIT_METHODS.find((m) => m.id === id)?.label ?? id;
}

export function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function cardLastFour(cardNumber: string) {
  const digits = cardNumber.replace(/\D/g, "");
  return digits.slice(-4).padStart(4, "0");
}

export function isValidCardNumber(cardNumber: string) {
  const digits = cardNumber.replace(/\D/g, "");
  return digits.length >= 16;
}

export function isValidExpiry(expiry: string) {
  return /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry.trim());
}

export function isValidCvv(cvv: string) {
  return /^\d{3,4}$/.test(cvv.trim());
}

"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { addTransaction, getTransactionsByUser } from "@/lib/bet-store";
import { recordUserDeposit, recordUserWithdrawal } from "@/lib/platform-store";
import { trackReferralDeposit } from "@/lib/referral-store";
import { updateUserBalance } from "@/lib/auth-store";
import {
  ApiError,
  confirmDepositOtpForPayment,
  depositWallet,
  formatPaymentUserError,
  initiateDeposit,
  isTerminalPaymentFailure,
  initiateWithdrawal,
  getPaymentStatus,
  getTransactions as apiGetTransactions,
  paymentNeedsOtp,
  paymentOtpErrorReference,
  useBackendApi,
  withdraw as apiWithdraw,
} from "@/lib/backend-client";
import { backendTransactionToLocal } from "@/lib/backend-mappers";
import type { Transaction } from "@/lib/bet-types";
import {
  DEPOSIT_METHODS,
  MOBILE_NETWORKS,
  USDT_NETWORKS,
  WITHDRAW_METHODS,
  estimateCryptoAmount,
  formatCardNumber,
  getCryptoDepositAddress,
  isValidCardNumber,
  isValidCvv,
  isValidExpiry,
  cardLastFour,
  mobileNetworkLabel,
  type DepositMethod,
  type MobileNetwork,
  type UsdtNetwork,
  type WithdrawMethod,
} from "@/lib/payment-methods";
import {
  depositAmountSymbol,
  depositQuickAmounts,
  formatDepositAmount,
  minDepositAmount,
  parseAmountInput,
  validateDepositAmount,
  walletDepositMarket,
} from "@/lib/deposit-limits";
import {
  inferGhanaMoMoNetwork,
  momoNetworkToProviderChannel,
  normalizeGhanaMoMoPhone,
  validateGhanaMoMoForNetwork,
} from "@/lib/momo-phone";
import { redirectToMoolreCheckout } from "@/lib/moolre-checkout";
import { CURRENCY_SYMBOL, formatMoney } from "@/lib/utils";

const WALLET_BTN =
  "touch-manipulation select-none transition-transform duration-75 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";

const WITHDRAW_AMOUNTS = [20, 50, 100, 200];
const PAYMENT_POLL_MS = 3000;
const PAYMENT_POLL_ATTEMPTS = 20;

async function waitForPaymentStatus(
  reference: string,
): Promise<Awaited<ReturnType<typeof getPaymentStatus>>> {
  let latest = await getPaymentStatus(reference);
  for (let attempt = 0; attempt < PAYMENT_POLL_ATTEMPTS; attempt += 1) {
    if (
      latest.status !== "pending" &&
      latest.status !== "processing"
    ) {
      return latest;
    }
    await new Promise((resolve) => window.setTimeout(resolve, PAYMENT_POLL_MS));
    latest = await getPaymentStatus(reference);
  }
  return latest;
}

function PaymentMethodIcon({
  src,
  size = 32,
  className = "",
}: {
  src: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      aria-hidden
    />
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-md border border-brand-soft bg-brand-light px-2.5 py-1.5 text-[10px] font-semibold text-brand-dark hover:bg-brand-soft"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function WalletPage() {
  const backendMode = useBackendApi();
  const { user, openLogin, refreshUser } = useAuth();
  const [tab, setTab] = useState<"deposit" | "withdraw" | "history">("deposit");
  const [amountInput, setAmountInput] = useState("");
  const [depositMethod, setDepositMethod] = useState<DepositMethod>("mobile-money");
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethod>("mobile-money");
  const [mobileNetwork, setMobileNetwork] = useState<MobileNetwork>("mtn");
  const [usdtNetwork, setUsdtNetwork] = useState<UsdtNetwork>("trc20");
  const [phone, setPhone] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [cryptoStep, setCryptoStep] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositOtpStep, setDepositOtpStep] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    id: string;
    provider_ref: string;
    amount: number;
  } | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const phoneFieldEdited = useRef(false);

  function clearDepositOtpStep() {
    setDepositOtpStep(false);
    setPendingPayment(null);
    setOtpInput("");
  }

  function depositFailureMessage(status: string, paidAmount: number): string {
    if (status === "failed") {
      return `Payment failed for ${formatMoney(paidAmount)}. Check the verification code, your MoMo balance, and that the number matches your network, then start a new deposit.`;
    }
    return `Deposit ${formatMoney(paidAmount)} ${status}.`;
  }

  async function finalizeDepositAfterPayment(
    providerRef: string,
    paidAmount: number,
  ): Promise<boolean> {
    const latest = await waitForPaymentStatus(providerRef);
    if (isTerminalPaymentFailure(latest.status)) {
      setError(depositFailureMessage(latest.status, paidAmount));
      setMessage("");
      clearDepositOtpStep();
      return false;
    }
    if (latest.status !== "completed") {
      setMessage(
        `Deposit ${formatMoney(paidAmount)} is still pending. If you approved on your phone, wait a moment and check your balance.`,
      );
      return true;
    }
    clearDepositOtpStep();
    await refreshUser();
    await loadTransactions();
    setCryptoStep(false);
    setMessage(`Deposited ${formatMoney(paidAmount)} successfully`);
    return true;
  }

  const loadTransactions = useCallback(async () => {
    if (!user || !backendMode) return;
    setTxLoading(true);
    setTxError("");
    try {
      const remote = await apiGetTransactions();
      setTransactions(remote.map(backendTransactionToLocal));
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setTxLoading(false);
    }
  }, [user, backendMode]);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }
    if (backendMode) {
      void loadTransactions();
    }
  }, [user, backendMode, loadTransactions]);

  useEffect(() => {
    phoneFieldEdited.current = false;
  }, [user?.id]);

  useEffect(() => {
    if (!user?.phone || phoneFieldEdited.current) return;
    const normalized = normalizeGhanaMoMoPhone(user.phone);
    if (normalized) setPhone(normalized);
    const inferred = inferGhanaMoMoNetwork(user.phone);
    if (inferred) setMobileNetwork(inferred);
  }, [user?.phone, user?.id]);

  if (!user) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="page-title">Wallet</h1>
          <p className="mt-0.5 text-xs text-muted">Balance & transactions</p>
        </div>
        <div className="card py-10 text-center text-xs text-muted">
          <p>Log in to manage your wallet</p>
          <button
            type="button"
            onClick={openLogin}
            className="mt-3 rounded-md bg-brand px-4 py-1.5 text-xs font-medium text-white"
          >
            Log in
          </button>
        </div>
      </div>
    );
  }

  const userId = user.id;
  const balance = user.balance;
  const depositMarket = walletDepositMarket(user.phone);
  const minDeposit = minDepositAmount(depositMarket);
  const depositSymbol = depositAmountSymbol(depositMarket);
  const depositPresets = depositQuickAmounts(depositMarket);
  const amount = parseAmountInput(amountInput);
  const localTransactions =
    !backendMode && tab === "history" ? getTransactionsByUser(user.id) : [];
  const displayTransactions = backendMode ? transactions : localTransactions;
  const activeMethod = tab === "deposit" ? depositMethod : withdrawMethod;

  function resetMessages() {
    setMessage("");
    setError("");
  }

  async function creditWallet(description: string) {
    const depositError = validateDepositAmount(amount, depositMarket);
    if (depositError) {
      setError(depositError);
      return false;
    }

    if (backendMode && depositMethod === "mobile-money") {
      setSubmitting(true);
      try {
        const momoPhone = normalizeGhanaMoMoPhone(phone);
        if (!momoPhone) {
          setError("Enter a valid Ghana mobile money number (e.g. 054 123 4567).");
          return false;
        }
        const inferredNetwork = inferGhanaMoMoNetwork(momoPhone) ?? mobileNetwork;
        const networkError = validateGhanaMoMoForNetwork(momoPhone, inferredNetwork);
        if (networkError) {
          setError(networkError);
          return false;
        }
        const payment = await initiateDeposit(
          amount,
          "mobile_money",
          momoPhone,
          crypto.randomUUID(),
          momoNetworkToProviderChannel(inferredNetwork),
        );
        if (redirectToMoolreCheckout(payment.authorization_url)) {
          return true;
        }
        if (isTerminalPaymentFailure(payment.status)) {
          setError(depositFailureMessage(payment.status, amount));
          return false;
        }
        if (payment.status === "completed") {
          clearDepositOtpStep();
          await refreshUser();
          await loadTransactions();
          setCryptoStep(false);
          setMessage(`Deposited ${formatMoney(amount)} successfully`);
          return true;
        }
        setPendingPayment({
          id: payment.id,
          provider_ref: payment.provider_ref,
          amount,
        });
        setDepositOtpStep(true);
        setOtpInput("");
        setMessage(
          "Enter the verification code sent to your phone to complete this deposit.",
        );
        return true;
      } catch (err) {
        const otpRef = paymentOtpErrorReference(err);
        if (otpRef) {
          setPendingPayment({
            id: otpRef,
            provider_ref: otpRef,
            amount,
          });
          setDepositOtpStep(true);
          setOtpInput("");
          setMessage(
            "Enter the verification code sent to your phone to complete this deposit.",
          );
          return true;
        }
        setError(formatPaymentUserError(err, "deposit"));
        return false;
      } finally {
        setSubmitting(false);
      }
    }

    if (backendMode) {
      setSubmitting(true);
      try {
        await depositWallet(amount, description);
        await refreshUser();
        await loadTransactions();
        setCryptoStep(false);
        setMessage(`Deposited ${formatMoney(amount)} successfully`);
        return true;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Deposit failed");
        return false;
      } finally {
        setSubmitting(false);
      }
    }

    const result = updateUserBalance(userId, amount);
    if ("error" in result) {
      setError(result.error);
      return false;
    }
    const tx = addTransaction({ userId, type: "deposit", amount, description });
    recordUserDeposit(userId, amount, description);
    trackReferralDeposit(userId, amount, tx.id);
    void refreshUser();
    setCryptoStep(false);
    setMessage(`Deposited ${formatMoney(amount)} successfully`);
    return true;
  }

  function validateVisaCard() {
    if (!isValidCardNumber(cardNumber)) {
      setError("Enter a valid 16-digit Visa card number");
      return false;
    }
    if (!cardName.trim()) {
      setError("Enter the name on card");
      return false;
    }
    if (!isValidExpiry(cardExpiry)) {
      setError("Enter expiry as MM/YY");
      return false;
    }
    if (!isValidCvv(cardCvv)) {
      setError("Enter a valid CVV");
      return false;
    }
    return true;
  }

  async function handleDepositOtpSubmit() {
    resetMessages();
    if (submitting || !pendingPayment) return;
    const code = otpInput.replace(/\D/g, "");
    if (code.length < 4) {
      setError("Enter the verification code from your phone (numbers only).");
      return;
    }
    setSubmitting(true);
    try {
      const payment = await confirmDepositOtpForPayment(pendingPayment, code);
      if (isTerminalPaymentFailure(payment.status)) {
        setError(
          depositFailureMessage(
            payment.status,
            payment.amount ?? pendingPayment.amount,
          ),
        );
        clearDepositOtpStep();
        return;
      }
      if (payment.status === "completed") {
        clearDepositOtpStep();
        await refreshUser();
        await loadTransactions();
        setMessage(
          `Deposited ${formatMoney(payment.amount ?? pendingPayment.amount)} successfully`,
        );
        return;
      }
      await finalizeDepositAfterPayment(
        payment.provider_ref || pendingPayment.provider_ref,
        payment.amount ?? pendingPayment.amount,
      );
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Verification failed. Try again.";
      setError(
        /payment failed/i.test(msg)
          ? `${msg} Use a fresh code from a new deposit if this one expired.`
          : msg,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeposit() {
    resetMessages();
    if (submitting) return;
    if (depositOtpStep) {
      await handleDepositOtpSubmit();
      return;
    }
    const depositError = validateDepositAmount(amount, depositMarket);
    if (depositError) {
      setError(depositError);
      return;
    }

    if (depositMethod === "mobile-money") {
      const momoPhone = normalizeGhanaMoMoPhone(phone);
      if (!momoPhone) {
        setError("Enter a valid Ghana mobile money number (e.g. 054 123 4567).");
        return;
      }
      const inferredNetwork = inferGhanaMoMoNetwork(momoPhone) ?? mobileNetwork;
      const networkError = validateGhanaMoMoForNetwork(momoPhone, inferredNetwork);
      if (networkError) {
        setError(networkError);
        return;
      }
      await creditWallet(`${mobileNetworkLabel(inferredNetwork)} deposit`);
      return;
    }

    if (depositMethod === "visa") {
      if (!validateVisaCard()) return;
      await creditWallet(`Visa deposit ΓÇóΓÇóΓÇóΓÇó ${cardLastFour(cardNumber)}`);
      return;
    }

    if (depositMethod === "btc" || depositMethod === "usdt") {
      if (!cryptoStep) {
        setCryptoStep(true);
        return;
      }

      await creditWallet(
        depositMethod === "btc"
          ? "Bitcoin (BTC) deposit"
          : `USDT deposit (${usdtNetwork.toUpperCase()})`,
      );
    }
  }

  async function handleWithdraw() {
    resetMessages();
    if (submitting) return;
    if (amount < 1) {
      setError("Minimum withdrawal is GHΓé╡1");
      return;
    }
    if (amount > balance) {
      setError("Insufficient balance");
      return;
    }

    if (withdrawMethod === "mobile-money") {
      const momoPhone = normalizeGhanaMoMoPhone(phone);
      if (!momoPhone) {
        setError("Enter a valid Ghana mobile money number (e.g. 054 123 4567).");
        return;
      }
      const networkError = validateGhanaMoMoForNetwork(momoPhone, mobileNetwork);
      if (networkError) {
        setError(networkError);
        return;
      }
    } else if (withdrawMethod === "visa") {
      if (!validateVisaCard()) return;
    } else if (cryptoAddress.trim().length < 10) {
      setError(`Enter a valid ${withdrawMethod.toUpperCase()} wallet address`);
      return;
    }

    const description =
      withdrawMethod === "mobile-money"
        ? `Withdrawal to ${mobileNetworkLabel(mobileNetwork)}`
        : withdrawMethod === "visa"
          ? `Withdrawal to Visa ΓÇóΓÇóΓÇóΓÇó ${cardLastFour(cardNumber)}`
          : `Withdrawal to ${withdrawMethod.toUpperCase()}`;

    if (backendMode && withdrawMethod === "mobile-money") {
      setSubmitting(true);
      try {
        const momoPhone = normalizeGhanaMoMoPhone(phone)!;
        const payment = await initiateWithdrawal(
          amount,
          "mobile_money",
          momoPhone,
          momoPhone,
          crypto.randomUUID(),
          momoNetworkToProviderChannel(mobileNetwork),
        );
        await refreshUser();
        await loadTransactions();
        if (payment.status === "pending" || payment.status === "processing") {
          setMessage("Withdrawal submitted. Waiting for confirmation.");
          const latest = await waitForPaymentStatus(payment.provider_ref);
          await refreshUser();
          await loadTransactions();
          if (latest.status === "failed" || latest.status === "reversed") {
            setError(`Withdrawal ${formatMoney(amount)} ${latest.status}`);
            setMessage("");
            return;
          }
          setMessage(
            latest.status === "completed"
              ? `Withdrawal of ${formatMoney(amount)} completed`
              : `Withdrawal of ${formatMoney(amount)} is pending confirmation`,
          );
          return;
        }
        setMessage(
          payment.status === "completed"
            ? `Withdrawal of ${formatMoney(amount)} completed`
            : `Withdrawal of ${formatMoney(amount)} is pending confirmation`,
        );
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Withdrawal failed");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (backendMode) {
      setSubmitting(true);
      try {
        await apiWithdraw(amount, description);
        await refreshUser();
        await loadTransactions();
        setMessage(`Withdrawal of ${formatMoney(amount)} submitted`);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Withdrawal failed");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const result = updateUserBalance(userId, -amount);
    if ("error" in result) {
      setError(result.error);
      return;
    }

    addTransaction({ userId, type: "withdraw", amount: -amount, description });
    recordUserWithdrawal(userId, amount, description);
    refreshUser();
    setMessage(`Withdrawal of ${formatMoney(amount)} submitted`);
  }

  const methods = tab === "deposit" ? DEPOSIT_METHODS : WITHDRAW_METHODS;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Wallet</h1>
        <p className="mt-0.5 text-xs text-muted">Deposit, withdraw & history</p>
      </div>

      {!backendMode && tab === "deposit" && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-amber-950 dark:text-amber-100">
          Demo wallet: deposits update balance in this browser only. Set{" "}
          <code className="text-[10px]">NEXT_PUBLIC_USE_BACKEND=true</code> and{" "}
          <code className="text-[10px]">BACKEND_URL</code> in{" "}
          <code className="text-[10px]">.env.local</code>, then restart{" "}
          <code className="text-[10px]">npm run dev</code>, for real mobile money.
        </p>
      )}

      <div className="card p-3">
        <p className="text-[11px] text-muted">Available balance</p>
        <p className="mt-0.5 text-2xl font-semibold text-brand">
          {formatMoney(user.balance)}
        </p>
      </div>

      <div className="card flex gap-0.5 p-0.5">
        {(["deposit", "withdraw", "history"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setCryptoStep(false);
              clearDepositOtpStep();
              resetMessages();
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium capitalize ${WALLET_BTN} ${
              tab === t
                ? "bg-brand-dark text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab !== "history" && (
        <>
          <div>
            <p className="section-label mb-1.5">Payment method</p>
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
              {methods.map((method) => {
                const selected = activeMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      if (tab === "deposit") {
                        setDepositMethod(method.id as DepositMethod);
                      } else {
                        setWithdrawMethod(method.id as WithdrawMethod);
                      }
                      setCryptoStep(false);
                      resetMessages();
                    }}
                    className={`rounded-lg border px-3 py-2.5 text-left ${WALLET_BTN} ${
                      selected
                        ? "border-brand bg-brand/10"
                        : "border-border/80 bg-surface hover:bg-surface-elevated"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {method.icon ? (
                        <PaymentMethodIcon
                          src={method.icon}
                          size={36}
                          className="h-9 w-9"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-[10px] font-bold text-brand-dark">
                          MoMo
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {method.label}
                          </span>
                          {method.badge && (
                            <span className="rounded bg-brand-light px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand-dark">
                              {method.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {backendMode &&
                          tab === "deposit" &&
                          method.id === "mobile-money"
                            ? "Pay with Moolre (MTN, Telecel, AirtelTigo)"
                            : method.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {activeMethod === "mobile-money" && (
            <div className="card space-y-3 p-3">
              {backendMode && tab === "deposit" && (
                <div className="rounded-md border border-border/70 bg-surface px-3 py-2.5">
                  <p className="text-xs font-semibold text-foreground">
                    Moolre secure checkout
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted">
                    After you confirm, you&apos;ll finish payment on Moolre (hosted
                    page or approval prompt on your phone).
                  </p>
                </div>
              )}
              {!(backendMode && tab === "deposit") && (
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-muted">Network</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MOBILE_NETWORKS.map((network) => (
                      <button
                        key={network.id}
                        type="button"
                        onClick={() => setMobileNetwork(network.id)}
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${WALLET_BTN} ${
                          mobileNetwork === network.id
                            ? "border-brand bg-brand text-white"
                            : "border-border/80 text-muted"
                        }`}
                      >
                        {network.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <label className="block">
                <span className="mb-1 block text-[11px] text-muted">
                  Mobile money number
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="024 123 4567"
                  value={phone}
                  onChange={(e) => {
                    phoneFieldEdited.current = true;
                    setPhone(e.target.value);
                  }}
                  className="w-full rounded-md border border-border/80 bg-surface-elevated px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </label>
              {tab === "deposit" && (
                <p className="text-[10px] leading-snug text-muted">
                  {backendMode
                    ? "Moolre mobile money: use the number that will approve the payment. You can clear this field and type another."
                    : "You will receive a prompt on your phone to approve the payment."}
                </p>
              )}
            </div>
          )}

          {activeMethod === "visa" && (
            <div className="card space-y-3 p-3">
              <div className="flex items-center gap-2.5 border-b border-border/60 pb-2">
                <PaymentMethodIcon
                  src="/icons/payments/visa.svg"
                  size={40}
                  className="h-10 w-10"
                />
                <p className="text-[10px] text-muted">
                  {tab === "deposit" ? "Secure card payment" : "Refund to saved card"}
                </p>
              </div>
              <label className="block">
                <span className="mb-1 block text-[11px] text-muted">Card number</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(formatCardNumber(e.target.value))
                  }
                  className="w-full rounded-md border border-border/80 bg-surface-elevated px-3 py-2 font-mono text-sm tracking-wider outline-none focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] text-muted">Name on card</span>
                <input
                  type="text"
                  autoComplete="cc-name"
                  placeholder="As shown on card"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full rounded-md border border-border/80 bg-surface-elevated px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] text-muted">Expiry</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                      setCardExpiry(v);
                    }}
                    className="w-full rounded-md border border-border/80 bg-surface-elevated px-3 py-2 font-mono text-sm outline-none focus:border-brand"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] text-muted">CVV</span>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) =>
                      setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    className="w-full rounded-md border border-border/80 bg-surface-elevated px-3 py-2 font-mono text-sm outline-none focus:border-brand"
                  />
                </label>
              </div>
              <p className="text-[10px] leading-snug text-muted">
                Demo only ΓÇö connect a PCI-compliant gateway (e.g. Moolre, Stripe) for
                live card processing.
              </p>
            </div>
          )}

          {activeMethod === "usdt" && (
            <div className="card space-y-3 p-3">
              <div className="flex items-center gap-2.5 border-b border-border/60 pb-2">
                <PaymentMethodIcon
                  src="/icons/payments/usdt.png"
                  size={40}
                  className="h-10 w-10"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">USDT</p>
                  <p className="text-[10px] text-muted">Tether stablecoin</p>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-medium text-muted">USDT network</p>
                <div className="flex gap-1.5">
                  {USDT_NETWORKS.map((network) => (
                    <button
                      key={network.id}
                      type="button"
                      onClick={() => {
                        setUsdtNetwork(network.id);
                        setCryptoStep(false);
                      }}
                      className={`flex-1 rounded-md border px-2 py-1.5 text-[11px] font-semibold ${
                        usdtNetwork === network.id
                          ? "border-brand bg-brand text-white"
                          : "border-border/80 text-muted"
                      }`}
                    >
                      {network.label}
                      <span className="mt-0.5 block text-[9px] font-normal opacity-80">
                        {network.fee}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              {tab === "withdraw" && (
                <label className="block">
                  <span className="mb-1 block text-[11px] text-muted">
                    Your USDT wallet address
                  </span>
                  <input
                    type="text"
                    placeholder={`Paste ${usdtNetwork.toUpperCase()} address`}
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                    className="w-full rounded-md border border-border/80 bg-surface-elevated px-3 py-2 font-mono text-xs outline-none focus:border-brand"
                  />
                </label>
              )}
            </div>
          )}

          {activeMethod === "btc" && (
            <div className="card space-y-3 p-3">
              <div className="flex items-center gap-2.5 border-b border-border/60 pb-2">
                <PaymentMethodIcon
                  src="/icons/payments/btc.png"
                  size={40}
                  className="h-10 w-10"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">Bitcoin</p>
                  <p className="text-[10px] text-muted">On-chain BTC transfer</p>
                </div>
              </div>
              {tab === "withdraw" && (
                <label className="block">
                  <span className="mb-1 block text-[11px] text-muted">
                    Your Bitcoin address
                  </span>
                  <input
                    type="text"
                    placeholder="Paste BTC address"
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                    className="w-full rounded-md border border-border/80 bg-surface-elevated px-3 py-2 font-mono text-xs outline-none focus:border-brand"
                  />
                </label>
              )}
            </div>
          )}

          {tab === "deposit" &&
            cryptoStep &&
            (depositMethod === "btc" || depositMethod === "usdt") && (
              <div className="card space-y-3 border-brand-soft bg-brand-light/40 p-3">
                <div className="flex items-center gap-2.5">
                  <PaymentMethodIcon
                    src={
                      depositMethod === "btc"
                        ? "/icons/payments/btc.png"
                        : "/icons/payments/usdt.png"
                    }
                    size={36}
                    className="h-9 w-9"
                  />
                  <p className="text-xs font-semibold text-brand-dark">
                    Send exactly{" "}
                    {estimateCryptoAmount(amount, depositMethod)}{" "}
                    {depositMethod === "btc" ? "BTC" : "USDT"} ({usdtNetwork.toUpperCase()})
                  </p>
                </div>
                <p className="text-[10px] text-muted">
                  Equivalent to {formatMoney(amount)} at current demo rate
                </p>
                <div className="flex items-start gap-2 rounded-md border border-brand-soft bg-white p-2.5">
                  <p className="min-w-0 flex-1 break-all font-mono text-[10px] leading-relaxed text-foreground">
                    {getCryptoDepositAddress(depositMethod, usdtNetwork)}
                  </p>
                  <CopyButton
                    value={getCryptoDepositAddress(depositMethod, usdtNetwork)}
                  />
                </div>
                <p className="text-[10px] leading-snug text-muted">
                  Send only {depositMethod === "btc" ? "BTC" : `USDT (${usdtNetwork.toUpperCase()})`} to
                  this address. Balance credits after network confirmation.
                </p>
              </div>
            )}

          <div className="flex flex-wrap gap-1.5">
            {(tab === "deposit" ? depositPresets : WITHDRAW_AMOUNTS).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setAmountInput(String(a));
                  setCryptoStep(false);
                }}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium ${WALLET_BTN} ${
                  Number.isFinite(amount) && Math.abs(amount - a) < 1e-9
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border/80 text-muted"
                }`}
              >
                {tab === "deposit"
                  ? formatDepositAmount(a, depositMarket)
                  : `${CURRENCY_SYMBOL}${a}`}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] text-muted">
              Amount ({tab === "deposit" ? depositSymbol : CURRENCY_SYMBOL})
            </span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={
                tab === "deposit"
                  ? minDeposit.toFixed(2)
                  : "1"
              }
              value={amountInput}
              onChange={(e) => {
                const next = e.target.value;
                if (next === "" || /^\d*\.?\d{0,2}$/.test(next)) {
                  setAmountInput(next);
                  setCryptoStep(false);
                }
              }}
              onFocus={(e) => e.target.select()}
              className="input-amount w-full rounded-md border border-border/80 bg-surface-elevated px-3 py-2 text-sm font-medium outline-none focus:border-brand"
            />
            {tab === "deposit" && (
              <p className="mt-1 text-[10px] text-muted">
                Minimum deposit{" "}
                {formatDepositAmount(minDeposit, depositMarket)}
                {depositMarket === "international" ? " (non-Ghana accounts)" : ""}
              </p>
            )}
          </label>

          {depositOtpStep && backendMode && tab === "deposit" && (
            <div className="card space-y-3 border-brand/40 bg-brand/5 p-3">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Verification code
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-muted">
                  Check SMS or the MoMo prompt on{" "}
                  {phone.trim() || "your phone"} and enter the code below.
                </p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter code"
                maxLength={16}
                value={otpInput}
                onChange={(e) => {
                  setOtpInput(e.target.value.replace(/[^\dA-Za-z]/g, "").slice(0, 16));
                  setError("");
                }}
                className="w-full rounded-md border border-border/80 bg-surface-elevated px-3 py-2.5 text-center font-mono text-lg tracking-[0.2em] outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={() => {
                  clearDepositOtpStep();
                  resetMessages();
                }}
                className="text-[11px] font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
              >
                Cancel and start over
              </button>
            </div>
          )}

          {error && <p className="text-xs text-live">{error}</p>}
          {message && <p className="text-xs text-brand">{message}</p>}

          <button
            type="button"
            onClick={() => void (tab === "deposit" ? handleDeposit() : handleWithdraw())}
            disabled={submitting}
            className={`w-full rounded-md bg-brand py-2.5 text-xs font-semibold text-white hover:bg-brand-dark ${WALLET_BTN}`}
          >
            {submitting
              ? "Processing..."
              : tab === "deposit"
                ? depositOtpStep
                  ? "Verify & complete deposit"
                  : cryptoStep && (depositMethod === "btc" || depositMethod === "usdt")
                    ? "I have sent payment"
                    : depositMethod === "mobile-money"
                      ? backendMode
                        ? "Continue to Moolre"
                        : "Pay with Mobile Money"
                      : depositMethod === "visa"
                        ? "Pay with Visa"
                        : "Continue"
                : "Withdraw"}
          </button>
        </>
      )}

      {tab === "history" && (
        <ul className="card divide-y divide-border/60 overflow-hidden">
          {txLoading ? (
            <li className="py-6 text-center text-xs text-muted">Loading transactions...</li>
          ) : txError ? (
            <li className="space-y-2 py-6 text-center">
              <p className="text-xs text-live">{txError}</p>
              <button
                type="button"
                onClick={() => void loadTransactions()}
                className="text-xs font-medium text-brand hover:underline"
              >
                Retry
              </button>
            </li>
          ) : displayTransactions.length === 0 ? (
            <li className="py-6 text-center text-xs text-muted">No transactions yet</li>
          ) : (
            displayTransactions.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-[10px] text-muted">
                    {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    tx.amount >= 0 ? "text-brand" : "text-foreground"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {formatMoney(Math.abs(tx.amount))}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

export interface BetSuccessInfo {
  bookingCode: string;
  stake: number;
  potentialWin: number;
}

interface BetSuccessfulModalProps {
  bet: BetSuccessInfo | null;
  onClose: () => void;
  onViewOpenBets: () => void;
}

function SuccessCheckIcon() {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-[0_3px_10px_rgba(26,85,104,0.35)] ring-4 ring-brand-light">
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

function SummaryRow({
  label,
  value,
  action,
}: {
  label: string;
  value?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-xs text-muted">{label}</span>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="text-xs font-semibold text-brand hover:text-brand-dark hover:underline"
        >
          {action.label}
        </button>
      ) : (
        <span className="text-sm font-bold tabular-nums text-foreground">{value}</span>
      )}
    </div>
  );
}

function ShareIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 10v6M12 7h.01" />
    </svg>
  );
}

export function BetSuccessfulModal({
  bet,
  onClose,
  onViewOpenBets,
}: BetSuccessfulModalProps) {
  const [copied, setCopied] = useState(false);

  if (!bet) return null;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(bet!.bookingCode);
    } catch {
      const input = document.createElement("textarea");
      input.value = bet!.bookingCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function shareCode() {
    const text = `BetPlus ticket ${bet!.bookingCode} — stake ${formatCurrency(bet!.stake)}, potential win ${formatCurrency(bet!.potentialWin)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "BetPlus Bet", text });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await copyCode();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-brand-dark/50 p-4 backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-labelledby="bet-success-title"
        className="relative w-full max-w-[292px] overflow-hidden rounded-lg border border-brand-soft bg-white shadow-[0_12px_40px_rgba(15,70,88,0.22)]"
      >
        <div className="h-1 bg-gradient-to-r from-brand-dark via-brand to-brand-accent" />

        <div className="bg-brand-light/60 px-4 pb-3 pt-4 text-center">
          <div className="flex justify-center">
            <SuccessCheckIcon />
          </div>
          <h2 id="bet-success-title" className="mt-2.5 text-[15px] font-bold text-brand-dark">
            Bet Successful
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">Your ticket is confirmed</p>
        </div>

        <div className="border-t border-brand-soft/80 px-4 py-1">
          <SummaryRow label="Total Stake" value={formatCurrency(bet.stake)} />
          <SummaryRow label="Potential Win" value={formatCurrency(bet.potentialWin)} />
          <SummaryRow
            label="Open Bets"
            action={{
              label: "View",
              onClick: () => {
                onViewOpenBets();
              },
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-brand-soft bg-brand-light/40 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate font-mono text-xs font-bold tracking-wide text-brand-dark">
              {bet.bookingCode}
            </span>
            <span className="shrink-0 text-brand/70" title="Use this code to verify your bet">
              <InfoIcon />
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 text-brand/80">
            <button
              type="button"
              onClick={shareCode}
              className="rounded p-0.5 hover:bg-brand-soft/60 hover:text-brand-dark"
              aria-label="Share bet"
            >
              <ShareIcon />
            </button>
            <button
              type="button"
              onClick={copyCode}
              className={`rounded p-0.5 hover:bg-brand-soft/60 ${copied ? "text-brand-accent" : "hover:text-brand-dark"}`}
              aria-label={copied ? "Copied" : "Copy bet code"}
            >
              <CopyIcon />
            </button>
            <button
              type="button"
              onClick={shareCode}
              className="text-xs font-semibold text-brand hover:text-brand-dark hover:underline"
            >
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

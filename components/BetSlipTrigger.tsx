"use client";

import { useBetSlip } from "@/lib/betslip-context";
import { BetSlipIcon } from "./BetSlipIcon";

interface BetSlipTriggerProps {
  className?: string;
  showLabel?: boolean;
  label?: string;
  iconSize?: "sm" | "md";
}

export function BetSlipTrigger({
  className = "",
  showLabel = false,
  label = "Betslip",
  iconSize = "md",
}: BetSlipTriggerProps) {
  const { selectionCount, setBetslipOpen } = useBetSlip();

  function openBetslip() {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      document.getElementById("betslip")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setBetslipOpen(true);
  }

  const size = iconSize === "sm" ? "h-5 w-5" : "h-6 w-6";

  return (
    <button
      type="button"
      onClick={openBetslip}
      className={`relative inline-flex items-center gap-1.5 ${className}`}
      aria-label={`Betslip${selectionCount > 0 ? `, ${selectionCount} selections` : ""}`}
    >
      <span className="relative">
        <BetSlipIcon className={size} />
        {selectionCount > 0 && (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-brand-dark">
            {selectionCount}
          </span>
        )}
      </span>
      {showLabel && (
        <span className="text-xs font-medium">{label}</span>
      )}
    </button>
  );
}

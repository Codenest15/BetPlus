"use client";

import { usePathname } from "next/navigation";
import { useBetSlip } from "@/lib/betslip-context";
import { BetSlipIcon } from "./BetSlipIcon";

export function BetSlipFab() {
  const pathname = usePathname();
  const { selectionCount, betslipOpen, setBetslipOpen } = useBetSlip();

  if (pathname?.startsWith("/account") || betslipOpen) return null;

  return (
    <button
      type="button"
      onClick={() => setBetslipOpen(true)}
      aria-label={`Betslip${selectionCount > 0 ? `, ${selectionCount} selections` : ""}`}
      className="fixed right-3 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-brand-dark text-white shadow-[0_2px_10px_rgb(15_70_88_/_0.35)] ring-1 ring-white/10 transition-transform active:scale-95 lg:hidden"
      style={{
        bottom: "calc(3.25rem + 0.75rem + env(safe-area-inset-bottom))",
      }}
    >
      <BetSlipIcon className="h-5 w-5" />
      <span
        className={`absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-0.5 text-[9px] font-bold leading-none ${
          selectionCount > 0
            ? "bg-brand-accent text-brand-dark"
            : "bg-white text-brand-dark ring-1 ring-brand-dark/20"
        }`}
      >
        {selectionCount}
      </span>
    </button>
  );
}

"use client";

import { useBetSlip } from "@/lib/betslip-context";
import type { Match } from "@/lib/types";
import { formatOdds } from "@/lib/utils";

interface PlayerOddsRowProps {
  match: Match;
  marketId: string;
  marketName: string;
  outcomeId: string;
  name: string;
  odds: number;
  live?: boolean;
}

export function PlayerOddsRow({
  match,
  marketId,
  marketName,
  outcomeId,
  name,
  odds,
  live = false,
}: PlayerOddsRowProps) {
  const { addMarketSelection, isMarketSelected } = useBetSlip();
  const selected = isMarketSelected(match.id, marketId, outcomeId);

  return (
    <button
      type="button"
      onClick={() =>
        addMarketSelection(match, {
          marketId,
          marketName,
          outcomeId,
          outcomeLabel: name,
          odds,
        })
      }
      className={`flex w-full items-center justify-between gap-3 border-b px-3 py-3 text-left transition-colors last:border-b-0 ${
        live
          ? selected
            ? "border-white/10 bg-white/10"
            : "border-white/10 hover:bg-white/5"
          : selected
            ? "border-brand-soft/40 bg-brand-light/60"
            : "border-brand-soft/40 hover:bg-brand-light/30"
      }`}
    >
      <span
        className={`min-w-0 truncate text-sm font-medium ${
          live ? "text-white" : "text-foreground"
        }`}
      >
        {name}
      </span>
      <span
        className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-bold tabular-nums ${
          selected
            ? live
              ? "border-brand-accent bg-brand-accent text-brand-dark"
              : "border-brand bg-brand text-white"
            : live
              ? "border-white/20 bg-white/10 text-white"
              : "border-brand-soft bg-gradient-to-b from-surface to-brand-light/70 text-brand-dark"
        }`}
      >
        {formatOdds(odds)}
      </span>
    </button>
  );
}

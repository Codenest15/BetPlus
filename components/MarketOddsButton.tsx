"use client";

import { useBetSlip } from "@/lib/betslip-context";
import type { Match } from "@/lib/types";
import { OddsCell } from "./OddsCell";

interface MarketOddsButtonProps {
  match: Match;
  marketId: string;
  marketName: string;
  outcomeId: string;
  label: string;
  odds: number;
  onLiveRow?: boolean;
}

export function MarketOddsButton({
  match,
  marketId,
  marketName,
  outcomeId,
  label,
  odds,
  onLiveRow = false,
}: MarketOddsButtonProps) {
  const { addMarketSelection, isMarketSelected } = useBetSlip();
  const selected = isMarketSelected(match.id, marketId, outcomeId);

  return (
    <OddsCell
      label={label}
      odds={odds}
      selected={selected}
      onLiveRow={onLiveRow}
      className="min-h-[2.75rem] py-1"
      onClick={() =>
        addMarketSelection(match, {
          marketId,
          marketName,
          outcomeId,
          outcomeLabel: label,
          odds,
        })
      }
    />
  );
}

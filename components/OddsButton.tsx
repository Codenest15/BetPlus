"use client";

import { useBetSlip } from "@/lib/betslip-context";
import { getLiveMatchOdds } from "@/lib/live-odds";
import type { Match, OddsSelection } from "@/lib/types";
import { OddsCell } from "./OddsCell";

interface OddsButtonProps {
  match: Match;
  selection: OddsSelection;
  label: string;
  compact?: boolean;
  onLiveRow?: boolean;
}

export function OddsButton({
  match,
  selection,
  label,
  compact = false,
  onLiveRow = false,
}: OddsButtonProps) {
  const { addSelection, isSelected } = useBetSlip();
  const odds = getLiveMatchOdds(match)[selection];
  const selected = isSelected(match.id, selection);

  if (!odds) return null;

  return (
    <OddsCell
      label={label}
      odds={odds}
      selected={selected}
      compact={compact}
      onLiveRow={onLiveRow}
      className={compact ? "min-h-[2.75rem] min-w-0 flex-1 py-1" : "min-h-[44px] py-1.5"}
      onClick={() => addSelection(match, selection)}
    />
  );
}

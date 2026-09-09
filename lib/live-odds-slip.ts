import { getMarketsForMatch } from "./match-markets";
import { getLiveMatchOdds } from "./live-odds";
import { isMatchLive } from "./match-status";
import type { BetSelection, Match, OddsSelection } from "./types";

/** Current in-play price for a betslip line (1X2 or any open market outcome). */
export function resolveSelectionLiveOdds(
  match: Match,
  selection: BetSelection,
): number | null {
  if (!isMatchLive(match)) return null;

  const live1x2 = getLiveMatchOdds(match);

  if (
    selection.marketId === "1x2" ||
    !selection.marketId ||
    selection.selection === "home" ||
    selection.selection === "draw" ||
    selection.selection === "away"
  ) {
    const side = selection.selection as OddsSelection;
    if (side === "home" || side === "draw" || side === "away") {
      return live1x2[side];
    }
  }

  const markets = getMarketsForMatch(match);
  for (const market of markets) {
    if (selection.marketId && market.id !== selection.marketId) continue;
    const outcome = market.outcomes.find(
      (o) =>
        o.id === selection.selection ||
        o.label === selection.selectionLabel,
    );
    if (outcome && !outcome.suspended) return outcome.odds;
  }

  return null;
}

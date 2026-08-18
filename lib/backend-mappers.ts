import type { BetLegResult, PlacedBet, Transaction } from "./bet-types";
import type { BetSelection } from "./types";
import type { BackendBet, BackendBetSelection, BackendTransaction } from "./backend-client";

export function backendTransactionToLocal(tx: BackendTransaction): Transaction {
  return {
    id: tx.id,
    userId: tx.user_id,
    type: tx.type as Transaction["type"],
    amount: tx.amount,
    description: tx.description ?? "",
    createdAt: tx.created_at,
    betId: tx.bet_id ?? undefined,
  };
}

function backendSelectionToLocal(sel: BackendBetSelection, index: number): BetSelection {
  return {
    id: `${sel.match_id}-${sel.market_id ?? "1x2"}-${sel.selection}-${index}`,
    matchId: sel.match_id,
    homeTeam: sel.home_team,
    awayTeam: sel.away_team,
    selection: sel.selection,
    selectionLabel: sel.selection_label,
    odds: sel.odds,
    league: sel.league,
    marketId: sel.market_id ?? undefined,
    marketName: sel.market_name ?? undefined,
  };
}

export function backendBetToPlacedBet(bet: BackendBet): PlacedBet {
  const selections = (bet.selections ?? []).map(backendSelectionToLocal);
  const legResults = bet.leg_results as BetLegResult[] | null | undefined;

  return {
    id: bet.id,
    bookingCode: bet.booking_code,
    ticketId: bet.ticket_id ?? undefined,
    verifyCode: bet.verify_code ?? undefined,
    userId: bet.user_id,
    selections,
    originalSelections: selections.map((s) => ({ ...s })),
    stake: bet.stake,
    totalOdds: bet.total_odds,
    potentialWin: bet.potential_win,
    bonus: bet.bonus ?? 0,
    flexCut: bet.flex_cut ?? undefined,
    status: bet.status as PlacedBet["status"],
    placedAt: bet.placed_at,
    legResults: legResults ?? undefined,
    settledAt: bet.settled_at ?? undefined,
    supportClaims: [],
  };
}

export function localSelectionToBackend(sel: BetSelection) {
  return {
    match_id: sel.matchId,
    home_team: sel.homeTeam,
    away_team: sel.awayTeam,
    selection: sel.selection,
    selection_label: sel.selectionLabel,
    odds: sel.odds,
    league: sel.league,
    market_id: sel.marketId,
    market_name: sel.marketName,
  };
}

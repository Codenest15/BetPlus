import type { BetSelection } from "./types";
import type { BetStatus, PlacedBet } from "./bet-types";
import { isLegPastFullTime } from "./bet-edit-rules";
import { evaluateLegAtFt, ftScoreLabel, legResultForIndex } from "./bet-settlement";
import { formatFtScore, getMatchFtScore } from "./match-results";

export interface TicketLegDisplay {
  selection: BetSelection;
  kickoffLabel: string;
  ftScore: string | null;
  /** null = pending / not settled */
  legWon: boolean | null;
  voidLeg?: boolean;
}

function formatTicketDate(iso: string) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}, ${hh}:${min}`;
}

function legKickoffLabel(bet: PlacedBet, index: number) {
  const demoKickoffs: Record<string, string[]> = {
    BPDEM02: ["01/31, 15:00", "01/31, 17:30", "02/01, 15:00"],
    BPDEM01: ["02/14, 14:30", "02/14, 16:30", "02/14, 18:30"],
  };
  const code = bet.bookingCode.toUpperCase();
  if (demoKickoffs[code]?.[index]) return demoKickoffs[code][index];

  const sel = bet.selections[index];
  if (sel?.kickoff) return formatTicketDate(sel.kickoff);

  const d = new Date(bet.placedAt);
  d.setDate(d.getDate() + index + 1);
  d.setHours(15, 0, 0, 0);
  return formatTicketDate(d.toISOString());
}

export function betTypeLabel(bet: PlacedBet) {
  if (bet.flexCut && bet.flexCut > 0) {
    return bet.selections.length > 1 ? `Flex ${bet.flexCut}` : "Single";
  }
  return bet.selections.length > 1 ? "Multiple" : "Single";
}

export function statusHeadline(status: BetStatus) {
  if (status === "won") return "Won";
  if (status === "lost") return "Lost";
  if (status === "void") return "Void";
  return "Open";
}

export function totalReturn(bet: PlacedBet) {
  if (bet.status === "won") return bet.potentialWin;
  if (bet.status === "void") return bet.stake;
  return 0;
}

/** Any leg or whole bet marked void — triggers “After Void” odds row. */
export function betHasVoidLeg(bet: PlacedBet): boolean {
  if (bet.status === "void") return true;
  return (bet.legResults ?? []).some((r) => r.void === true);
}

export function originalTicketOdds(bet: PlacedBet): number {
  return bet.originalTotalOdds ?? bet.totalOdds;
}

/** Recalculated accumulator odds excluding void legs. */
export function totalOddsAfterVoid(bet: PlacedBet): number {
  const voidLegs = new Set(
    (bet.legResults ?? []).filter((r) => r.void).map((r) => r.legIndex),
  );

  if (bet.status === "void" && voidLegs.size === 0) {
    return 1;
  }

  const active = bet.selections.filter((_, i) => !voidLegs.has(i));
  if (active.length === 0) return 1;

  return (
    Math.round(active.reduce((acc, s) => acc * s.odds, 1) * 100) / 100
  );
}

export function betUsedFreeBet(bet: PlacedBet): boolean {
  return bet.usedFreeBet === true;
}

/** Amount shown in open-bets / bet-history list cards. */
export function listDisplayReturn(bet: PlacedBet) {
  if (bet.status === "open") return bet.potentialWin;
  return totalReturn(bet);
}

export function listReturnLabel(bet: PlacedBet) {
  return bet.status === "open" ? "Pot. Win" : "Total Return";
}

export function ticketBonus(bet: PlacedBet) {
  if (bet.bonus != null && bet.bonus > 0) return bet.bonus;
  if (bet.selections.length >= 3) {
    const odds = originalTicketOdds(bet);
    return Math.round(bet.stake * odds * 0.04 * 100) / 100;
  }
  return 0;
}

export function ticketId(bet: PlacedBet) {
  return bet.ticketId ?? (bet.bookingCode.replace(/\D/g, "").slice(0, 6) || "000000");
}

export function verifyCode(bet: PlacedBet) {
  return bet.verifyCode ?? bet.bookingCode;
}

export function getLegDisplays(bet: PlacedBet): TicketLegDisplay[] {
  return bet.selections.map((sel, i) => {
    const stored = legResultForIndex(bet, i);
    const managerFt = sel.managerFtScore
      ? formatFtScore(sel.managerFtScore.home, sel.managerFtScore.away)
      : null;

    if (stored) {
      return {
        selection: sel,
        kickoffLabel: legKickoffLabel(bet, i),
        ftScore: ftScoreLabel(stored),
        legWon: stored.void ? null : stored.won,
        voidLeg: stored.void,
      };
    }

    if (managerFt) {
      const evaluated = evaluateLegAtFt(bet, i);
      return {
        selection: sel,
        kickoffLabel: legKickoffLabel(bet, i),
        ftScore: managerFt,
        legWon: evaluated ? (evaluated.void ? null : evaluated.won) : null,
        voidLeg: evaluated?.void,
      };
    }

    if (bet.status === "open" && isLegPastFullTime(bet, i)) {
      const evaluated = evaluateLegAtFt(bet, i);
      if (evaluated) {
        return {
          selection: sel,
          kickoffLabel: legKickoffLabel(bet, i),
          ftScore: ftScoreLabel(evaluated),
          legWon: evaluated.void ? null : evaluated.won,
          voidLeg: evaluated.void,
        };
      }
    }

    if (bet.status !== "open") {
      const evaluated = evaluateLegAtFt(bet, i);
      if (evaluated) {
        return {
          selection: sel,
          kickoffLabel: legKickoffLabel(bet, i),
          ftScore: ftScoreLabel(evaluated),
          legWon: evaluated.void ? null : evaluated.won,
          voidLeg: evaluated.void,
        };
      }

      const { home, away } = getMatchFtScore(sel.matchId);
      return {
        selection: sel,
        kickoffLabel: legKickoffLabel(bet, i),
        ftScore: formatFtScore(home, away),
        legWon: null,
      };
    }

    return {
      selection: sel,
      kickoffLabel: legKickoffLabel(bet, i),
      ftScore: null,
      legWon: null,
    };
  });
}

export function formatAmountPlain(amount: number) {
  return amount.toFixed(2);
}

/** Ticket scores use colons (2:1) — never dashes (2-1). */
export function normalizeTicketScoreLabel(label: string): string {
  return label.replace(/(\d+)\s*-\s*(\d+)/g, "$1:$2");
}

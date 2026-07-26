import type { BetSelection } from "./types";
import type { BetStatus, PlacedBet } from "./bet-types";

export interface TicketLegDisplay {
  selection: BetSelection;
  kickoffLabel: string;
  ftScore: string | null;
  /** null = pending / not settled */
  legWon: boolean | null;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const DEMO_FT_SCORES: Record<string, string> = {
  "m-leeds-arsenal": "0:4",
  "m-chelsea-westham": "0:3",
  "m-elche-barcelona": "2:1",
  "m-werder-bayern": "0:2",
  "m-wolfsburg-leipzig": "0:3",
  "m-hoffenheim-heidenheim": "2:0",
};

function mockFtScore(matchId: string, legWon: boolean | null): string {
  if (DEMO_FT_SCORES[matchId]) return DEMO_FT_SCORES[matchId];
  const h = hash(matchId);
  const home = (h % 3) + (legWon === false ? 2 : 0);
  const away = ((h >> 3) % 4) + (legWon === true ? 1 : 0);
  return `${home}:${away}`;
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

  const d = new Date(bet.placedAt);
  d.setDate(d.getDate() + index + 1);
  d.setHours(15, 0, 0, 0);
  return formatTicketDate(d.toISOString());
}

export function betTypeLabel(bet: PlacedBet) {
  return bet.selections.length > 1 ? "Multiple" : "Singles";
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

export function ticketBonus(bet: PlacedBet) {
  if (bet.bonus != null && bet.bonus > 0) return bet.bonus;
  if (bet.selections.length >= 3 && bet.status === "won") {
    return Math.round(bet.stake * bet.totalOdds * 0.04 * 100) / 100;
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
  const settled = bet.status !== "open";

  return bet.selections.map((sel, i) => {
    let legWon: boolean | null = null;

    if (bet.status === "won") {
      legWon = true;
    } else if (bet.status === "lost") {
      // One leg spoils the accumulator — earlier legs win, one leg loses
      const losingLegIndex = bet.selections.length - 1;
      legWon = i < losingLegIndex;
    } else if (bet.status === "void") {
      legWon = null;
    }

    const ftScore = settled ? mockFtScore(sel.matchId, legWon) : null;

    return {
      selection: sel,
      kickoffLabel: legKickoffLabel(bet, i),
      ftScore,
      legWon: settled ? legWon : null,
    };
  });
}

export function formatAmountPlain(amount: number) {
  return amount.toFixed(2);
}

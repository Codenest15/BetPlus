import type { BetSelection } from "./types";
import type { PlacedBet, Transaction } from "./bet-types";
import {
  createDemoLostBet,
  createDemoWonBet,
  DEMO_LOST_CODE,
  DEMO_WIN_CODE,
} from "./demo-bets";

const BETS_KEY = "betplus_bets";
const TRANSACTIONS_KEY = "betplus_transactions";

function readBets(): PlacedBet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BETS_KEY);
    return raw ? (JSON.parse(raw) as PlacedBet[]) : [];
  } catch {
    return [];
  }
}

function writeBets(bets: PlacedBet[]) {
  localStorage.setItem(BETS_KEY, JSON.stringify(bets));
}

function readTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

function writeTransactions(txs: Transaction[]) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
}

function generateBookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BP";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  const existing = readBets().some((b) => b.bookingCode === code);
  return existing ? generateBookingCode() : code;
}

function generateTicketId(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateVerifyCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GH";
  for (let i = 0; i < 16; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function placeBet(input: {
  userId: string;
  selections: BetSelection[];
  stake: number;
  totalOdds: number;
  potentialWin: number;
}): PlacedBet {
  const bonus =
    input.selections.length >= 3
      ? Math.round(input.stake * input.totalOdds * 0.04 * 100) / 100
      : 0;

  const bet: PlacedBet = {
    id: crypto.randomUUID(),
    bookingCode: generateBookingCode(),
    ticketId: generateTicketId(),
    verifyCode: generateVerifyCode(),
    userId: input.userId,
    selections: input.selections,
    stake: input.stake,
    totalOdds: input.totalOdds,
    potentialWin: input.potentialWin,
    bonus,
    status: "open",
    placedAt: new Date().toISOString(),
  };

  const bets = readBets();
  bets.unshift(bet);
  writeBets(bets);

  const txs = readTransactions();
  txs.unshift({
    id: crypto.randomUUID(),
    userId: input.userId,
    type: "bet",
    amount: -input.stake,
    description: `Bet ${bet.bookingCode}`,
    createdAt: bet.placedAt,
    betId: bet.id,
  });
  writeTransactions(txs);

  return bet;
}

/** Inserts one won + one lost demo ticket for bet history (once per user). */
export function ensureDemoHistoryBets(userId: string): void {
  if (typeof window === "undefined") return;

  const bets = readBets();
  const hasWin = bets.some(
    (b) => b.userId === userId && b.bookingCode === DEMO_WIN_CODE,
  );
  const hasLost = bets.some(
    (b) => b.userId === userId && b.bookingCode === DEMO_LOST_CODE,
  );

  const toAdd: PlacedBet[] = [];
  if (!hasWin) toAdd.push(createDemoWonBet(userId));
  if (!hasLost) toAdd.push(createDemoLostBet(userId));
  if (toAdd.length === 0) return;

  writeBets([...toAdd, ...bets]);
}

export function getBetsByUser(userId: string): PlacedBet[] {
  ensureDemoHistoryBets(userId);
  return readBets().filter((b) => b.userId === userId);
}

export function getBetByCode(code: string): PlacedBet | null {
  const normalized = code.trim().toUpperCase();
  return readBets().find((b) => b.bookingCode === normalized) ?? null;
}

export function getBetByVerifyCode(code: string): PlacedBet | null {
  const normalized = code.trim().toUpperCase();
  return (
    readBets().find(
      (b) =>
        b.verifyCode?.toUpperCase() === normalized ||
        b.bookingCode === normalized,
    ) ?? null
  );
}

export function getBetById(id: string): PlacedBet | null {
  return readBets().find((b) => b.id === id) ?? null;
}

export function getTransactionsByUser(userId: string): Transaction[] {
  return readTransactions().filter((t) => t.userId === userId);
}

export function addTransaction(input: {
  userId: string;
  type: Transaction["type"];
  amount: number;
  description: string;
}): Transaction {
  const tx: Transaction = {
    id: crypto.randomUUID(),
    userId: input.userId,
    type: input.type,
    amount: input.amount,
    description: input.description,
    createdAt: new Date().toISOString(),
  };
  const txs = readTransactions();
  txs.unshift(tx);
  writeTransactions(txs);
  return tx;
}

export function clearSettledBets(userId: string): void {
  const bets = readBets().filter(
    (b) => b.userId !== userId || b.status === "open",
  );
  writeBets(bets);
}

export function updateBetStatus(
  betId: string,
  status: PlacedBet["status"],
): PlacedBet | null {
  const bets = readBets();
  const idx = bets.findIndex((b) => b.id === betId);
  if (idx === -1) return null;
  bets[idx] = { ...bets[idx], status };
  writeBets(bets);
  return bets[idx];
}

export function deleteBetById(betId: string): boolean {
  const bets = readBets();
  const next = bets.filter((b) => b.id !== betId);
  if (next.length === bets.length) return false;
  writeBets(next);
  return true;
}

export function generateSlipCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  if (typeof window !== "undefined") {
    const existing = loadSharedSlip(code);
    if (existing) return generateSlipCode();
  }
  return code;
}

export function saveSharedSlipCode(
  code: string,
  selections: BetSelection[],
  stake: number,
): void {
  const key = "betplus_shared_slips";
  let slips: Record<string, { selections: BetSelection[]; stake: number }> = {};
  try {
    const raw = localStorage.getItem(key);
    if (raw) slips = JSON.parse(raw);
  } catch {
    /* ignore */
  }
  slips[code.trim().toUpperCase()] = { selections, stake };
  localStorage.setItem(key, JSON.stringify(slips));
}

export function loadSharedSlip(code: string): {
  selections: BetSelection[];
  stake: number;
} | null {
  const key = "betplus_shared_slips";
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const slips = JSON.parse(raw) as Record<
      string,
      { selections: BetSelection[]; stake: number }
    >;
    return slips[code.trim().toUpperCase()] ?? null;
  } catch {
    return null;
  }
}

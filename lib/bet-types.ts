import type { BetSelection } from "./types";

export type BetStatus = "open" | "won" | "lost" | "void";

export interface PlacedBet {
  id: string;
  bookingCode: string;
  /** Short numeric ticket id shown on ticket details */
  ticketId?: string;
  /** Long verification code for sharing */
  verifyCode?: string;
  userId: string;
  selections: BetSelection[];
  stake: number;
  totalOdds: number;
  potentialWin: number;
  bonus?: number;
  status: BetStatus;
  placedAt: string;
}

export type TransactionType = "deposit" | "withdraw" | "bet" | "win";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: string;
  betId?: string;
}

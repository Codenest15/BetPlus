import type { BetSelection } from "./types";

export type BetStatus = "open" | "won" | "lost" | "void";

/** Immutable snapshot of picks at the moment the bet was placed. */
export type BetSelectionRecord = BetSelection[];

export type SupportClaimStatus =
  | "open"
  | "record_confirmed"
  | "pick_corrected"
  | "resolved";

/** Logged when a user contacts support disputing what they picked. */
export interface BetSupportClaim {
  id: string;
  /** Index of the leg in the bet slip (0-based) */
  legIndex: number;
  /** What the user says they picked, e.g. "Over 1.5" */
  userClaim: string;
  /** What our record shows was placed on that leg */
  recordedPick: string;
  status: SupportClaimStatus;
  adminNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

/** Admin/manager pick change audit — stored for staff only, never shown on user tickets. */
export interface BetLegCorrection {
  legIndex: number;
  fromPick: string;
  toPick: string;
  correctedAt: string;
  note?: string;
}

/** Per-leg result after Full Time — used for auto-settlement display */
export interface BetLegResult {
  legIndex: number;
  homeScore: number;
  awayScore: number;
  won: boolean;
  /** Match voided by manager — whole bet should void */
  void?: boolean;
}

export interface PlacedBet {
  id: string;
  bookingCode: string;
  /** Short numeric ticket id shown on ticket details */
  ticketId?: string;
  /** Long verification code for sharing */
  verifyCode?: string;
  userId: string;
  selections: BetSelection[];
  /** Admin audit copy at first edit — not shown on user tickets. */
  originalSelections?: BetSelectionRecord;
  stake: number;
  /** Admin audit — stake before first staff edit. */
  originalStake?: number;
  totalOdds: number;
  /** Combined odds before void legs excluded — for “After Void” row only. */
  originalTotalOdds?: number;
  potentialWin: number;
  /** Admin audit — return before first staff edit. */
  originalPotentialWin?: number;
  bonus?: number;
  /** Admin audit — bonus before first staff edit. */
  originalBonus?: number;
  /** Stake was paid from admin free-bet reward, not wallet balance. */
  usedFreeBet?: boolean;
  status: BetStatus;
  placedAt: string;
  supportClaims?: BetSupportClaim[];
  /** Admin-only audit trail for pick changes — not shown on user ticket */
  legCorrections?: BetLegCorrection[];
  /** Leg outcomes after FT — filled automatically */
  legResults?: BetLegResult[];
  /** Allowed losing legs (flex). 0/undefined = standard — one loss loses the whole bet. */
  flexCut?: number;
  settledAt?: string;
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

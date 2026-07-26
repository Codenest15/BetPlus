"use client";

import type { PlacedBet } from "@/lib/bet-types";
import {
  betTypeLabel,
  formatAmountPlain,
  statusHeadline,
  ticketBonus,
  ticketId,
  totalReturn,
} from "@/lib/ticket-display";
import { formatOdds } from "@/lib/utils";
import { WinTrophyIcon } from "./WinTrophyIcon";

interface TicketSummaryProps {
  bet: PlacedBet;
}

function TrophyBadge() {
  return (
    <WinTrophyIcon
      tone="accent"
      className="h-8 w-8 shrink-0 drop-shadow-[0_1px_2px_rgba(13,151,55,0.35)]"
    />
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-white/60">{label}</span>
      <span className="shrink-0 font-semibold tabular-nums text-white">{value}</span>
    </div>
  );
}

export function TicketSummary({ bet }: TicketSummaryProps) {
  const isWon = bet.status === "won";
  const isLost = bet.status === "lost";
  const isOpen = bet.status === "open";
  const bonus = ticketBonus(bet);
  const ret = totalReturn(bet);
  const displayReturn = isOpen ? bet.potentialWin : ret;

  const placedLabel = new Date(bet.placedAt)
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(",", "");

  return (
    <section className="bg-brand text-white">
      <div className="px-3 py-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] text-white/55">Ticket ID: {ticketId(bet)}</p>
            <p className="mt-1 text-base font-bold text-[#f5c842]">{betTypeLabel(bet)}</p>
          </div>

          <div className="text-right">
            <p className="text-[11px] text-white/55">{placedLabel}</p>
            <div className="mt-1 flex items-center justify-end gap-1.5">
              {isWon && <TrophyBadge />}
              <span
                className={`text-sm font-bold ${isWon ? "text-accent" : isLost ? "text-live" : "text-amber-300"}`}
              >
                {statusHeadline(bet.status)}
              </span>
              <span
                className={`text-2xl font-bold leading-none tabular-nums ${
                  isWon ? "text-accent" : isLost ? "text-live" : "text-white"
                }`}
              >
                {formatAmountPlain(displayReturn)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
          <SummaryRow label="Total Stake" value={formatAmountPlain(bet.stake)} />
          {isLost && (
            <SummaryRow label="Free Bet Gift" value={`-${formatAmountPlain(bet.stake)}`} />
          )}
          <SummaryRow label="Total Odds (Original)" value={formatOdds(bet.totalOdds)} />
          {bonus > 0 && isWon && (
            <SummaryRow label="Total Bonus" value={formatAmountPlain(bonus)} />
          )}
          {(isWon || isLost) && (
            <SummaryRow
              label="Total Odds (After Void)"
              value={formatOdds(displayReturn / bet.stake || bet.totalOdds)}
            />
          )}
          {isOpen && (
            <SummaryRow label="Potential Return" value={formatAmountPlain(bet.potentialWin)} />
          )}
        </div>
      </div>
    </section>
  );
}

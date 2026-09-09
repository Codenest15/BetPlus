"use client";

import Link from "next/link";
import { useState } from "react";
import type { BetStatus, PlacedBet } from "@/lib/bet-types";
import { isLegPastFullTime } from "@/lib/bet-edit-rules";
import { evaluateLegAtFt, ftScoreLabel } from "@/lib/bet-settlement";
import { formatFtScore, getMatchFtScore } from "@/lib/match-results";
import {
  getLegDisplays,
  listDisplayReturn,
  listReturnLabel,
  type TicketLegDisplay,
} from "@/lib/ticket-display";
import { formatMoney, formatOdds } from "@/lib/utils";

function isSettled(status: BetStatus) {
  return status !== "open";
}

function betTypeLabel(bet: PlacedBet) {
  return bet.selections.length > 1 ? "Multiple" : "Single";
}

function statusLabel(status: BetStatus) {
  if (status === "won") return "Won";
  if (status === "lost") return "Lost";
  if (status === "void") return "Void";
  return "Open";
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function LegStatusIcon({
  won,
  lost,
  finished,
}: {
  won: boolean;
  lost: boolean;
  finished: boolean;
}) {
  if (won) {
    return (
      <span className="relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-white ring-2 ring-white">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (lost) {
    return (
      <span className="relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-live text-white ring-2 ring-white">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
    );
  }
  if (finished) {
    return (
      <span className="relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-dark text-[9px] font-extrabold tracking-wide text-white ring-2 ring-white">
        FT
      </span>
    );
  }
  return (
    <span className="relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white ring-2 ring-white">
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 7v5l3 2" />
      </svg>
    </span>
  );
}

function legConnectorClass(won: boolean, lost: boolean, finished: boolean) {
  if (won) return "bg-accent/70";
  if (lost) return "bg-live/70";
  if (finished) return "bg-brand/40";
  return "bg-brand-soft";
}

function resolveOpenBetLeg(
  bet: PlacedBet,
  legIndex: number,
  leg: TicketLegDisplay,
): TicketLegDisplay & { finished: boolean } {
  if (leg.ftScore || leg.legWon !== null) {
    return { ...leg, finished: true };
  }

  if (isLegPastFullTime(bet, legIndex)) {
    const evaluated = evaluateLegAtFt(bet, legIndex);
    if (evaluated) {
      return {
        ...leg,
        ftScore: ftScoreLabel(evaluated),
        legWon: evaluated.void ? null : evaluated.won,
        voidLeg: evaluated.void,
        finished: true,
      };
    }

    const { home, away } = getMatchFtScore(leg.selection.matchId);
    return {
      ...leg,
      ftScore: formatFtScore(home, away),
      finished: true,
    };
  }

  return { ...leg, finished: false };
}

function LegFtResultBadge({
  ftScore,
  won,
  lost,
  voidLeg,
}: {
  ftScore: string;
  won: boolean;
  lost: boolean;
  voidLeg?: boolean;
}) {
  const tone = won
    ? "border-accent/35 bg-accent/10 text-accent"
    : lost
      ? "border-live/35 bg-live-soft text-live"
      : "border-brand-soft bg-brand-light text-brand-dark";

  const label = voidLeg ? "Void" : won ? "Won" : lost ? "Lost" : "Full Time";

  return (
    <div
      className={`mt-2 inline-flex items-center gap-2 rounded-md border px-2.5 py-1 ${tone}`}
    >
      <span className="text-[11px] font-bold tabular-nums">FT {ftScore}</span>
      <span className="h-3 w-px bg-current opacity-25" aria-hidden />
      <span className="text-[11px] font-semibold">{label}</span>
    </div>
  );
}

function OpenBetLegRow({
  bet,
  legIndex,
  leg: rawLeg,
  isLast,
}: {
  bet: PlacedBet;
  legIndex: number;
  leg: TicketLegDisplay;
  isLast: boolean;
}) {
  const leg = resolveOpenBetLeg(bet, legIndex, rawLeg);
  const sel = leg.selection;
  const marketName = sel.marketName ?? "1X2";
  const kickoffShort = leg.kickoffLabel.replace(",", "");
  const won = leg.legWon === true;
  const lost = leg.legWon === false;
  const finished = leg.finished;
  const connector = legConnectorClass(won, lost, finished);
  const timelineX = "calc(0.875rem + 14px)"; /* px-3.5 + half icon */

  const rowBg = won
    ? "bg-accent-soft/55"
    : lost
      ? "bg-live-soft/45"
      : finished
        ? "bg-brand-light/50"
        : "bg-white";
  const rowBorder = won
    ? "border-l-[3px] border-l-accent"
    : lost
      ? "border-l-[3px] border-l-live"
      : finished
        ? "border-l-[3px] border-l-brand/50"
        : "border-l-[3px] border-l-transparent";

  return (
    <div className={`relative ${rowBg} ${rowBorder} ${isLast ? "" : "border-b border-border/60"}`}>
      {!isLast && (
        <span
          aria-hidden
          className={`pointer-events-none absolute z-[1] w-0.5 ${connector}`}
          style={{
            left: timelineX,
            top: "calc(0.75rem + 14px)",
            bottom: "-1px",
            transform: "translateX(-50%)",
          }}
        />
      )}
      {isLast && (
        <span
          aria-hidden
          className={`pointer-events-none absolute z-[1] w-0.5 ${connector}`}
          style={{
            left: timelineX,
            top: "calc(0.75rem + 14px)",
            bottom: 0,
            transform: "translateX(-50%)",
          }}
        />
      )}

      <div className="relative flex gap-2.5 px-3.5 py-3">
        <div className="flex w-7 shrink-0 flex-col items-center">
          <LegStatusIcon won={won} lost={lost} finished={finished} />
        </div>
      <div className="min-w-0 flex-1 pb-0.5">
        <p className="text-[13px] font-bold leading-snug text-foreground">
          {sel.selectionLabel} @ {formatOdds(sel.odds)}
        </p>
        <p className="mt-0.5 text-[12px] text-muted">{marketName}</p>
        <Link
          href={`/match/${sel.matchId}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 block truncate text-[12px] font-medium text-brand underline-offset-2 hover:underline"
        >
          {sel.homeTeam} vs {sel.awayTeam}
        </Link>
        {finished && leg.ftScore ? (
          <LegFtResultBadge
            ftScore={leg.ftScore}
            won={won}
            lost={lost}
            voidLeg={leg.voidLeg}
          />
        ) : null}
        <p className="mt-1 text-[11px] text-muted">{kickoffShort}</p>
      </div>
    </div>
    </div>
  );
}

function OpenBetLegsList({ bet }: { bet: PlacedBet }) {
  const legs = getLegDisplays(bet);
  return (
    <div className="relative bg-white">
      {legs.map((leg, i) => (
        <OpenBetLegRow
          key={`${leg.selection.id}-${i}`}
          bet={bet}
          legIndex={i}
          leg={leg}
          isLast={i === legs.length - 1}
        />
      ))}
    </div>
  );
}

function OpenBetCard({ bet }: { bet: PlacedBet }) {
  const [expanded, setExpanded] = useState(false);
  const first = bet.selections[0];
  const extra = bet.selections.length - 1;
  const stakeText = formatMoney(bet.stake).replace("GH₵", "").trim();
  const returnText = formatMoney(listDisplayReturn(bet)).replace("GH₵", "").trim();
  const returnLabel = listReturnLabel(bet);

  return (
    <article className="relative overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between border-b border-brand-soft bg-brand-light px-3.5 py-2.5">
          <span className="text-[13px] font-bold text-foreground">{betTypeLabel(bet)}</span>
          <span className="inline-flex items-center gap-0.5 text-[13px] font-bold text-muted">
            Open
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 opacity-90" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 rotate-90 opacity-90" />
            )}
          </span>
        </div>

        {expanded ? (
          <OpenBetLegsList bet={bet} />
        ) : (
          first && (
            <div className="border-b border-border/60 px-3.5 py-3">
              <p className="text-[13px] leading-snug text-foreground">
                <span className="font-semibold">
                  {first.homeTeam} v {first.awayTeam}
                </span>
                {extra > 0 && (
                  <span className="font-normal text-muted">
                    {" "}
                    ...(and {extra} other match{extra > 1 ? "es" : ""})
                  </span>
                )}
              </p>
            </div>
          )
        )}

        {expanded && (
          <div className="border-b border-border/60 px-3.5 py-2">
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand">
              Hide Match Details
              <ChevronDown className="h-3 w-3" />
            </span>
          </div>
        )}

        <div className="flex items-start justify-between gap-8 px-3.5 py-3.5">
          <div>
            <p className="text-[11px] text-muted">Stake</p>
            <p className="mt-1 text-[17px] font-bold tabular-nums leading-tight text-foreground">
              {stakeText}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted">{returnLabel}</p>
            <p className="mt-1 text-[17px] font-bold tabular-nums leading-tight text-foreground">
              {returnText}
            </p>
          </div>
        </div>
      </button>

      <div className="border-t border-border px-3.5 py-2">
        <Link
          href={`/bet/${bet.bookingCode}`}
          className="text-[12px] font-medium text-brand hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          View full ticket
        </Link>
      </div>
    </article>
  );
}

export interface BetHistoryCardProps {
  bet: PlacedBet;
  onRemix?: () => void;
  /** Close betslip sheet when opening ticket (mobile) */
  onOpenTicket?: () => void;
}

export function BetHistoryCard({ bet, onRemix, onOpenTicket }: BetHistoryCardProps) {
  if (bet.status === "open") {
    return <OpenBetCard bet={bet} />;
  }

  const first = bet.selections[0];
  const extra = bet.selections.length - 1;
  const settled = isSettled(bet.status);
  const stakeText = formatMoney(bet.stake).replace("GH₵", "").trim();
  const returnText = formatMoney(listDisplayReturn(bet)).replace("GH₵", "").trim();
  const returnLabel = listReturnLabel(bet);
  const ticketHref = `/bet/${bet.bookingCode}`;
  const showRemix = settled && !!onRemix;

  const statusColor =
    bet.status === "lost"
      ? "text-live"
      : bet.status === "won"
        ? "text-accent"
        : "text-muted";

  function openTicket() {
    onOpenTicket?.();
  }

  return (
    <article className="relative overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <Link
        href={ticketHref}
        onClick={openTicket}
        className="group block no-underline"
      >
        <div className="flex items-center justify-between border-b border-brand-soft bg-brand-light px-3.5 py-2.5 transition-colors group-hover:bg-brand-soft/40 group-active:bg-brand-soft">
          <span className="text-[13px] font-bold text-foreground">{betTypeLabel(bet)}</span>
          <span className={`inline-flex items-center gap-0.5 text-[13px] font-bold ${statusColor}`}>
            {statusLabel(bet.status)}
            <ChevronRight className="h-3.5 w-3.5 opacity-90" />
          </span>
        </div>

        <div className="px-3.5 py-3.5 transition-colors group-hover:bg-surface-elevated/50 group-active:bg-surface-elevated">
          <div className="flex items-start justify-between gap-8">
            <div>
              <p className="text-[11px] text-muted">Total Stake(GHS)</p>
              <p className="mt-1 text-[17px] font-bold tabular-nums leading-tight text-foreground">
                {stakeText}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted">{returnLabel}</p>
              <p
                className={`mt-1 text-[17px] font-bold tabular-nums leading-tight ${
                  bet.status === "won" ? "text-accent" : "text-foreground"
                }`}
              >
                {returnText}
              </p>
            </div>
          </div>

          {first && (
            <p className={`mt-3.5 text-[13px] leading-snug text-foreground ${showRemix ? "pr-[7.5rem]" : ""}`}>
              <span className="font-semibold">
                {first.homeTeam} v {first.awayTeam}
              </span>
              {extra > 0 && (
                <span className="font-normal text-muted">
                  {" "}
                  ...(and {extra} other match{extra > 1 ? "es" : ""})
                </span>
              )}
            </p>
          )}
        </div>
      </Link>

      {showRemix && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemix();
          }}
          className="absolute bottom-3.5 right-3.5 z-10 rounded-md bg-brand-accent px-4 py-2 text-[13px] font-bold text-brand-dark shadow-sm transition-all hover:brightness-95 active:scale-[0.97]"
        >
          Remix Bet
        </button>
      )}
    </article>
  );
}

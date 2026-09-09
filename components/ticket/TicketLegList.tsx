"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { PlacedBet } from "@/lib/bet-types";
import {
  normalizeTicketScoreLabel,
  type TicketLegDisplay,
} from "@/lib/ticket-display";
import { getBetById } from "@/lib/bet-store";
import { formatOdds } from "@/lib/utils";
import { ManagerLegEditModal } from "@/components/manager/ManagerLegEditModal";

const TIMELINE_X = "1.625rem"; /* px-3 + half of 28px icon */

function legConnectorClass(won: boolean, lost: boolean, finished: boolean) {
  if (won) return "bg-accent/75";
  if (lost) return "bg-live/75";
  if (finished) return "bg-brand/45";
  return "bg-brand-soft";
}

function StatusIcon({
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
      <span className="relative z-[2] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-white ring-2 ring-white">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (lost) {
    return (
      <span className="relative z-[2] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-live text-white ring-2 ring-white">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
    );
  }
  if (finished) {
    return (
      <span className="relative z-[2] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-dark text-[9px] font-extrabold tracking-wide text-white ring-2 ring-white">
        FT
      </span>
    );
  }
  return (
    <span className="relative z-[2] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white ring-2 ring-white">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 7v5l3 2" />
      </svg>
    </span>
  );
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

function TrophyWatermark() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-0 w-[42%] overflow-hidden"
      aria-hidden
    >
      <svg
        className="absolute -right-2 top-1/2 h-[105%] max-h-[120px] min-h-[88px] w-auto -translate-y-1/2 text-accent opacity-[0.09]"
        viewBox="0 0 128 128"
        fill="currentColor"
      >
        <path d="M34 42c-14 4-18 18-12 30 2 4 6 7 10 8" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" opacity="0.85" />
        <path d="M94 42c14 4 18 18 12 30-2 4-6 7-10 8" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" opacity="0.85" />
        <path d="M38 34h52c0 0 2 8-2 12H40c-4-4-2-12-2-12z" opacity="0.9" />
        <path d="M40 46h48l-5 44H45L40 46z" opacity="0.75" />
        <rect x="54" y="88" width="20" height="9" rx="2" opacity="0.85" />
        <rect x="46" y="96" width="36" height="11" rx="3" opacity="0.9" />
        <rect x="42" y="105" width="44" height="8" rx="2.5" opacity="0.85" />
      </svg>
    </div>
  );
}

function LostWatermark() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-0 w-[42%] overflow-hidden"
      aria-hidden
    >
      <svg
        className="absolute -right-1 top-1/2 h-[88%] max-h-[100px] w-auto -translate-y-1/2 text-live opacity-[0.08]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
}

interface TicketLegItemProps {
  leg: TicketLegDisplay;
  legIndex: number;
  betId: string;
  canEdit: boolean;
  isLast: boolean;
  onBetUpdate?: (bet: PlacedBet) => void;
}

export function TicketLegItem({
  leg,
  legIndex,
  betId,
  canEdit,
  isLast,
  onBetUpdate,
}: TicketLegItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const won = leg.legWon === true;
  const lost = leg.legWon === false;
  const pending = leg.legWon === null;
  const finished = !!leg.ftScore || leg.legWon !== null;
  const pickLabel = normalizeTicketScoreLabel(leg.selection.selectionLabel);
  const pickOdds = formatOdds(leg.selection.odds);
  const outcomeLabel = normalizeTicketScoreLabel(
    leg.selection.outcomeLabel ?? leg.selection.selectionLabel,
  );
  const marketName = leg.selection.marketName ?? "1X2";
  const connector = legConnectorClass(won, lost, finished);

  function handleSaved() {
    const updated = getBetById(betId);
    if (updated && onBetUpdate) onBetUpdate(updated);
  }

  return (
    <>
      <li
        className={`relative overflow-hidden ${
          isLast ? "" : "border-b border-brand-soft"
        } ${
          won
            ? "border-l-[3px] border-l-accent bg-accent-soft"
            : lost
              ? "border-l-[3px] border-l-live bg-live-soft/40"
              : "border-l-[3px] border-l-brand/30 bg-brand-light"
        }`}
      >
        {/* Spine segment — runs from icon centre down through card border to next icon */}
        {!isLast && (
          <span
            aria-hidden
            className={`pointer-events-none absolute z-[1] w-0.5 ${connector}`}
            style={{
              left: TIMELINE_X,
              top: "calc(0.75rem + 14px)",
              bottom: "-1px",
              transform: "translateX(-50%)",
            }}
          />
        )}

        {/* Last leg — line ends at bottom edge of card */}
        {isLast && (
          <span
            aria-hidden
            className={`pointer-events-none absolute z-[1] w-0.5 ${connector}`}
            style={{
              left: TIMELINE_X,
              top: "calc(0.75rem + 14px)",
              bottom: 0,
              transform: "translateX(-50%)",
            }}
          />
        )}

        {won && <TrophyWatermark />}
        {lost && finished && <LostWatermark />}

        <div className="relative flex gap-3 px-3 py-3">
          <div className="flex w-7 shrink-0 flex-col items-center">
            <StatusIcon won={won} lost={lost} finished={finished} />
          </div>

          <div className="relative z-[1] min-w-0 flex-1 pr-2">
            <p className="text-[11px] text-muted sm:text-xs">{leg.kickoffLabel}</p>

            <p className="mt-0.5 text-sm font-bold leading-snug text-foreground sm:text-base">
              {leg.selection.homeTeam} - {leg.selection.awayTeam}
            </p>

            {leg.ftScore ? (
              <LegFtResultBadge
                ftScore={leg.ftScore}
                won={won}
                lost={lost}
                voidLeg={leg.voidLeg}
              />
            ) : pending ? (
              <p className="mt-1 text-xs font-medium text-amber-600">
                {leg.voidLeg ? "Void leg" : "Awaiting result"}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => {
                if (canEdit) setEditOpen(true);
              }}
              className={`mt-2 w-full space-y-0.5 rounded-md text-left text-xs sm:text-[13px] ${
                canEdit
                  ? "cursor-pointer ring-brand/0 transition hover:bg-white/40 active:bg-white/50"
                  : "cursor-default"
              }`}
              aria-label={canEdit ? "Edit leg pick, market, outcome and odds" : undefined}
            >
              <p className="flex flex-wrap items-center gap-1 text-foreground">
                <span className="text-muted">Pick:</span>
                <span className="font-bold">
                  {pickLabel} @ {pickOdds}
                </span>
                {won && (
                  <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {lost && (
                  <svg className="h-3.5 w-3.5 text-live" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </p>
              <p>
                <span className="text-muted">Market:</span>{" "}
                <span className="font-medium text-foreground">{marketName}</span>
              </p>
              <p>
                <span className="text-muted">Outcome:</span>{" "}
                <span className="font-medium text-foreground">{outcomeLabel}</span>
              </p>
            </button>
          </div>
        </div>
      </li>

      {canEdit && (
        <ManagerLegEditModal
          open={editOpen}
          legIndex={legIndex}
          selection={leg.selection}
          legWon={leg.legWon}
          voidLeg={leg.voidLeg}
          ftScore={leg.ftScore}
          betId={betId}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

interface TicketLegListProps {
  bet: PlacedBet;
  legs: TicketLegDisplay[];
  onBetUpdate?: (bet: PlacedBet) => void;
}

export function TicketLegList({ bet, legs, onBetUpdate }: TicketLegListProps) {
  const { canManage } = useAuth();
  const canEdit = canManage && !!onBetUpdate;

  return (
    <ul className="relative overflow-hidden bg-white">
      {legs.map((leg, index) => (
        <TicketLegItem
          key={`${leg.selection.id}-${index}`}
          leg={leg}
          legIndex={index}
          betId={bet.id}
          canEdit={canEdit}
          isLast={index === legs.length - 1}
          onBetUpdate={onBetUpdate}
        />
      ))}
    </ul>
  );
}

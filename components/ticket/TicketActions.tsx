"use client";

import type { BetStatus } from "@/lib/bet-types";

function RemixIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 11c0-2.21-1.79-4-4-4V3L6 8v4l8 5v-4c2.21 0 4-1.79 4-4zM4 12H2v4h2v-4z" />
    </svg>
  );
}

interface TicketActionsProps {
  status: BetStatus;
  onRemix: () => void;
  onShowOff?: () => void;
}

export function TicketActions({ status, onRemix, onShowOff }: TicketActionsProps) {
  if (status === "won") {
    return (
      <div className="grid grid-cols-2">
        <button
          type="button"
          onClick={onShowOff}
          className="inline-flex items-center justify-center gap-2 bg-[#f5c842] py-3.5 text-sm font-bold text-brand-dark active:bg-[#e5b832] sm:py-4"
        >
          <MegaphoneIcon />
          Show Off
        </button>
        <button
          type="button"
          onClick={onRemix}
          className="inline-flex items-center justify-center gap-2 bg-brand-accent py-3.5 text-sm font-bold text-brand-dark active:brightness-95 sm:py-4"
        >
          <RemixIcon />
          Remix Bet
        </button>
      </div>
    );
  }

  if (status === "lost") {
    return null;
  }

  if (status === "open") {
    return (
      <div className="bg-brand px-3 py-3">
        <button
          type="button"
          onClick={onRemix}
          className="inline-flex w-full items-center justify-center gap-2 rounded bg-brand-accent py-3 text-sm font-bold text-brand-dark active:brightness-95"
        >
          <RemixIcon />
          Remix Bet
        </button>
      </div>
    );
  }

  return null;
}

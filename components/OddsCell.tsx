"use client";

import { formatOdds } from "@/lib/utils";

interface OddsCellProps {
  label: string;
  odds: number;
  selected: boolean;
  onClick: () => void;
  className?: string;
  compact?: boolean;
  onLiveRow?: boolean;
  suspended?: boolean;
}

export function OddsCell({
  label,
  odds,
  selected,
  onClick,
  className = "",
  compact = false,
  onLiveRow = false,
  suspended = false,
}: OddsCellProps) {
  const idleClass = onLiveRow
    ? "border-white/20 bg-white/10 hover:border-white/30 hover:bg-white/15"
    : "border-brand-soft/80 bg-brand-light/40 hover:border-brand/25 hover:bg-brand-light/60";

  const idleOddsClass = onLiveRow ? "text-white" : "text-brand-dark";

  if (suspended) {
    return (
      <div
        className={`flex min-w-0 flex-1 cursor-not-allowed flex-col items-center justify-center rounded-sm border px-1 opacity-45 ${
          onLiveRow
            ? "border-white/15 bg-white/5"
            : "border-brand-soft/50 bg-brand-light/20"
        } ${className}`}
        aria-disabled
        title="Odds suspended — updating"
      >
        {!compact && (
          <span
            className={`max-w-full truncate text-[11px] font-medium leading-tight ${
              onLiveRow ? "text-white/45" : "text-muted"
            }`}
          >
            {label}
          </span>
        )}
        <span
          className={`${compact ? "text-xs" : "mt-1 text-sm"} font-bold leading-none ${
            onLiveRow ? "text-white/35" : "text-muted"
          }`}
          aria-hidden
        >
          —
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-sm px-1 transition-all active:scale-[0.98] ${
        selected
          ? "border border-brand-accent bg-brand-accent text-brand-dark shadow-sm"
          : idleClass
      } ${className}`}
    >
      {!compact && (
        <span
          className={`max-w-full truncate text-[11px] font-medium leading-tight ${
            selected ? "text-brand-dark/90" : onLiveRow ? "text-white/70" : "text-muted"
          }`}
        >
          {label}
        </span>
      )}
      <span
        className={`${compact ? "text-xs" : "mt-1 text-sm"} font-bold tabular-nums leading-none ${
          selected ? "text-brand-dark" : idleOddsClass
        }`}
      >
        {formatOdds(odds)}
      </span>
    </button>
  );
}

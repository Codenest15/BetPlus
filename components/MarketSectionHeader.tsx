"use client";

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

export function StarIcon({
  filled,
  className = "h-4 w-4",
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`${className} ${filled ? "fill-amber-400 text-amber-400" : "fill-none text-current"}`}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.75}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

interface MarketSectionHeaderProps {
  name: string;
  collapsed: boolean;
  isFavourite: boolean;
  highlighted?: boolean;
  onToggleCollapse: () => void;
  onToggleFavourite: () => void;
  live?: boolean;
}

export function MarketSectionHeader({
  name,
  collapsed,
  isFavourite,
  highlighted = false,
  onToggleCollapse,
  onToggleFavourite,
  live = false,
}: MarketSectionHeaderProps) {
  return (
    <div
      className={`flex items-center gap-1.5 border-b px-2 py-2 ${
        live
          ? "border-white/10 bg-[var(--live-surface)]"
          : "border-brand-soft/50 bg-brand-light/40"
      } ${highlighted ? (live ? "ring-2 ring-inset ring-live/40" : "ring-2 ring-inset ring-brand/40") : ""}`}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand market" : "Collapse market"}
        className={`shrink-0 rounded p-1 ${
          live ? "text-white/70 hover:bg-white/10" : "text-brand hover:bg-brand/10"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className={`h-3.5 w-3.5 transition-transform ${collapsed ? "-rotate-90" : ""}`}
          fill="currentColor"
        >
          <path d="M8 5l8 7-8 7V5z" />
        </svg>
      </button>

      <h3
        className={`min-w-0 flex-1 truncate text-[13px] font-bold ${
          live ? "text-white" : "text-foreground"
        }`}
      >
        {name}
      </h3>

      <button
        type="button"
        onClick={onToggleFavourite}
        aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
        className={`shrink-0 rounded p-1.5 transition-colors ${
          isFavourite
            ? "text-amber-500 hover:text-amber-400"
            : live
              ? "text-white/45 hover:bg-white/10 hover:text-amber-400"
              : "text-muted hover:bg-surface-elevated hover:text-amber-500"
        }`}
      >
        <StarIcon filled={isFavourite} className="h-4 w-4" />
      </button>
    </div>
  );
}

interface MarketSearchBarProps {
  query: string;
  onChange: (query: string) => void;
  favouritesOnly: boolean;
  onToggleFavouritesOnly: () => void;
  favouriteCount: number;
  live?: boolean;
}

export function MarketSearchBar({
  query,
  onChange,
  favouritesOnly,
  onToggleFavouritesOnly,
  favouriteCount,
  live = false,
}: MarketSearchBarProps) {
  return (
    <div
      className={`sticky top-[5.25rem] z-10 flex items-center gap-2 border-b px-3 py-2 ${
        live
          ? "border-white/10 bg-[var(--live-surface-deep)]"
          : "border-brand-soft bg-surface"
      }`}
    >
      <div
        className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
          live
            ? "border-white/15 bg-white/10"
            : "border-border bg-surface-elevated"
        }`}
      >
        <SearchIcon className={`h-4 w-4 shrink-0 ${live ? "text-white/50" : "text-muted"}`} />
        <input
          type="search"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search markets…"
          className={`min-w-0 flex-1 bg-transparent text-xs outline-none ${
            live
              ? "text-white placeholder:text-white/40"
              : "text-foreground placeholder:text-muted"
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={() => onChange("")}
            className={`shrink-0 text-[10px] font-medium ${
              live ? "text-white/60 hover:text-white" : "text-muted hover:text-foreground"
            }`}
          >
            Clear
          </button>
        )}
      </div>
      <button
        type="button"
        title="Show favourite markets only"
        aria-label="Show favourite markets only"
        onClick={onToggleFavouritesOnly}
        className={`flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
          favouritesOnly
            ? "border-amber-400/50 bg-amber-400/15 text-amber-400"
            : live
              ? "border-white/15 bg-white/10 text-white/55 hover:text-amber-400"
              : "border-border bg-surface-elevated text-muted hover:text-amber-500"
        }`}
      >
        <StarIcon filled={favouritesOnly || favouriteCount > 0} className="h-3.5 w-3.5" />
        {favouriteCount > 0 && (
          <span className="tabular-nums">{favouriteCount}</span>
        )}
      </button>
    </div>
  );
}

export function filterMarketsByQuery<T extends { id: string; name: string; outcomes: { label: string }[] }>(
  markets: T[],
  query: string,
): T[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return markets;
  return markets.filter(
    (market) =>
      market.name.toLowerCase().includes(trimmed) ||
      market.id.toLowerCase().includes(trimmed) ||
      market.outcomes.some((outcome) =>
        outcome.label.toLowerCase().includes(trimmed),
      ),
  );
}

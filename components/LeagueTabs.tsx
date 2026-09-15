"use client";

import type { CatalogLeague } from "@/lib/catalog-types";
import { getFeaturedLeagueIds } from "@/lib/catalog-featured";
import { ScrollRow } from "./ScrollRow";

interface LeagueTabsProps {
  leagues: CatalogLeague[];
  active: number | null;
  onChange: (leagueId: number | null) => void;
  loadingLeague?: number | null;
}

const pillClass = (active: boolean) =>
  `shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium ${
    active
      ? "bg-brand-dark text-white"
      : "bg-surface-elevated text-muted"
  }`;

export function LeagueTabs({
  leagues,
  active,
  onChange,
  loadingLeague,
}: LeagueTabsProps) {
  const featured = new Set(getFeaturedLeagueIds());
  const options = leagues
    .filter((league) => featured.has(league.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (options.length === 0) return null;

  return (
    <ScrollRow fadeEdge trackClassName="py-0.5">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={pillClass(active === null)}
      >
        All leagues
      </button>
      {options.map((league) => {
        const isActive = active === league.id;
        const isLoading = loadingLeague === league.id;

        return (
          <button
            key={league.id}
            type="button"
            title={league.name}
            onClick={() => onChange(league.id)}
            className={pillClass(isActive)}
          >
            {isLoading ? `${league.name}…` : league.name}
          </button>
        );
      })}
    </ScrollRow>
  );
}

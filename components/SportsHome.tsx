"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATALOG_PAGE_SIZE } from "@/lib/catalog-client";
import { useCatalog } from "@/lib/catalog-context";
import {
  featuredVisibleForSport,
  leaguesVisibleForSport,
  mergeHomeSportEvents,
} from "@/lib/home-events";
import { useMatchSearch } from "@/lib/match-search-context";
import type { CatalogEventQuery } from "@/lib/catalog-types";
import type { Sport } from "@/lib/types";
import { FeaturedMatches } from "./FeaturedMatches";
import { LeagueTabs } from "./LeagueTabs";
import { MatchListSkeleton } from "./MatchListSkeleton";
import { MatchRow } from "./MatchRow";
import { SectionTabs, type SectionTab } from "./SectionTabs";
import { SportTabs } from "./SportTabs";

function localDateISO(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function homeQuery(input: {
  section: SectionTab;
  sport: Sport | "all";
  leagueId: number | null;
  searchQuery: string;
  searching: boolean;
}): CatalogEventQuery {
  const sport = input.sport === "all" ? undefined : input.sport;
  const leagueId = input.leagueId ?? undefined;
  if (input.searching) {
    return {
      search: input.searchQuery.trim(),
      sport,
      leagueId,
      limit: CATALOG_PAGE_SIZE,
    };
  }
  if (input.section === "live") {
    return { status: "live", sport, leagueId, limit: CATALOG_PAGE_SIZE };
  }
  if (input.section === "soon") {
    return {
      status: "upcoming",
      date: localDateISO(),
      sport,
      leagueId,
      limit: CATALOG_PAGE_SIZE,
    };
  }
  if (leagueId) {
    return { status: "upcoming", sport, leagueId, limit: CATALOG_PAGE_SIZE };
  }
  return { status: "all", sport, windowDays: 7, limit: CATALOG_PAGE_SIZE };
}

export function SportsHome() {
  const {
    loading,
    loadingMore,
    hasMore,
    error,
    events,
    source,
    leagues,
    loadEvents,
    reload,
  } = useCatalog();
  const { query: searchQuery, searching } = useMatchSearch();
  const [sport, setSport] = useState<Sport | "all">("all");
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const [section, setSection] = useState<SectionTab>("all");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const query = useMemo(
    () =>
      homeQuery({
        section,
        sport,
        leagueId,
        searchQuery,
        searching,
      }),
    [section, sport, leagueId, searchQuery, searching],
  );

  useEffect(() => {
    void loadEvents(query);
  }, [query, loadEvents]);

  useEffect(() => {
    if (section !== "live") return;
    const tick = () => {
      if (document.visibilityState === "hidden") return;
      void loadEvents(query, { force: true });
    };
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [section, query, loadEvents]);

  const handleSportChange = (next: Sport | "all") => {
    setSport(next);
    if (!leaguesVisibleForSport(next)) {
      setLeagueId(null);
    }
  };

  const displayEvents = useMemo(() => {
    if (source === "api") return events;
    return mergeHomeSportEvents(events);
  }, [events, source]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    void loadEvents(query, { append: true });
  }, [hasMore, loadingMore, loading, loadEvents, query]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, displayEvents.length]);

  const leagueLoading = leagueId !== null && loading;
  const showLeagues = leaguesVisibleForSport(sport) && leagues.length > 0;
  const showFeatured = featuredVisibleForSport(sport, searching);
  const showSkeleton = loading && displayEvents.length === 0;

  return (
    <div className="-mx-3 space-y-0 sm:mx-0">
      {showFeatured && (
        <FeaturedMatches events={displayEvents} leagues={leagues} />
      )}
      <div className="home-feed">
        <div className="home-toolbar py-1">
          <SectionTabs active={section} onChange={setSection} />
          <div className="home-toolbar-divider" aria-hidden />
          <div className="min-w-0 py-2">
            <SportTabs active={sport} onChange={handleSportChange} />
          </div>
          {showLeagues && (
            <>
              <div className="home-toolbar-divider" aria-hidden />
              <div className="min-w-0 py-2">
                <LeagueTabs
                  leagues={leagues}
                  active={leagueId}
                  onChange={setLeagueId}
                  loadingLeague={loading ? leagueId : null}
                />
              </div>
            </>
          )}
        </div>

        {searching && (
          <p className="border-b border-brand-soft/50 px-3 py-1.5 text-[10px] text-muted">
            {displayEvents.length} {displayEvents.length === 1 ? "match" : "matches"} found
            — use the header search to change or clear.
          </p>
        )}

        {error && displayEvents.length === 0 ? (
          <div className="space-y-2 py-8 text-center">
            <p className="text-xs text-muted">{error}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="text-xs font-medium text-brand"
            >
              Retry
            </button>
          </div>
        ) : showSkeleton || leagueLoading ? (
          <MatchListSkeleton />
        ) : displayEvents.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">
            {searching
              ? `No matches found for "${searchQuery.trim()}".`
              : section === "live"
                ? "No live matches available."
                : "No matches found."}
          </p>
        ) : (
          <div className="match-list">
            {displayEvents.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
            <div ref={sentinelRef} className="h-4" />
            {loadingMore && (
              <p className="py-3 text-center text-[10px] text-muted">Loading more…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

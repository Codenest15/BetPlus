"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAllFromCatalog,
  getLiveFromCatalog,
  getTodayFromCatalog,
} from "@/lib/catalog-filters";
import { useCatalog } from "@/lib/catalog-context";
import {
  featuredVisibleForSport,
  leaguesVisibleForSport,
  mergeHomeSportEvents,
} from "@/lib/home-events";
import { useMatchSearch } from "@/lib/match-search-context";
import { filterMatchesBySearch } from "@/lib/match-search";
import type { Sport } from "@/lib/types";
import { FeaturedMatches } from "./FeaturedMatches";
import { LeagueTabs } from "./LeagueTabs";
import { MatchRow } from "./MatchRow";
import { SectionTabs, type SectionTab } from "./SectionTabs";
import { SportTabs } from "./SportTabs";

function applySportLeagueFilter(
  events: ReturnType<typeof getAllFromCatalog>,
  sport: Sport | "all",
  leagueId: number | null,
) {
  let list = events;
  if (sport !== "all") {
    list = list.filter((event) => event.sport === sport);
  }
  if (leagueId !== null) {
    list = list.filter((event) => event.leagueId === leagueId);
  }
  return list;
}

export function SportsHome() {
  const { loading, events, leagues, loadLeagueEvents, loadingLeagueId } =
    useCatalog();
  const { query: searchQuery, searching } = useMatchSearch();
  const [sport, setSport] = useState<Sport | "all">("all");
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const [section, setSection] = useState<SectionTab>("all");

  const homeEvents = useMemo(() => mergeHomeSportEvents(events), [events]);

  useEffect(() => {
    if (leagueId !== null) {
      void loadLeagueEvents(leagueId);
    }
  }, [leagueId, loadLeagueEvents]);

  const handleSportChange = (next: Sport | "all") => {
    setSport(next);
    if (!leaguesVisibleForSport(next)) {
      setLeagueId(null);
    }
  };

  const viewFilter = useMemo(
    () => ({
      sport: sport === "all" ? undefined : sport,
      leagueId: leagueId ?? undefined,
    }),
    [sport, leagueId],
  );

  const matches = useMemo(() => {
    if (searching) {
      const pool = applySportLeagueFilter(homeEvents, sport, leagueId);
      return filterMatchesBySearch(pool, searchQuery).sort((a, b) => {
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
        return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
      });
    }

    if (section === "live") return getLiveFromCatalog(homeEvents, viewFilter);
    if (section === "soon") return getTodayFromCatalog(homeEvents, viewFilter);
    return getAllFromCatalog(homeEvents, viewFilter);
  }, [
    section,
    viewFilter,
    homeEvents,
    sport,
    leagueId,
    searchQuery,
    searching,
  ]);

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      const leagueCmp = a.league.localeCompare(b.league);
      if (leagueCmp !== 0) return leagueCmp;
      return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
    });
  }, [matches]);

  const leagueLoading = leagueId !== null && loadingLeagueId === leagueId;
  const showLeagues = leaguesVisibleForSport(sport) && leagues.length > 0;
  const showFeatured = featuredVisibleForSport(sport, searching);

  return (
    <div className="-mx-3 space-y-0 sm:mx-0">
      {showFeatured && (
        <FeaturedMatches events={homeEvents} leagues={leagues} />
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
                  loadingLeague={loadingLeagueId}
                />
              </div>
            </>
          )}
        </div>

        {searching && (
          <p className="border-b border-brand-soft/50 px-3 py-1.5 text-[10px] text-muted">
            {matches.length} {matches.length === 1 ? "match" : "matches"} found
            — use the header search to change or clear.
          </p>
        )}

        {sortedMatches.length === 0 && !loading && !leagueLoading ? (
          <p className="py-8 text-center text-xs text-muted">
            {searching
              ? `No matches found for "${searchQuery.trim()}".`
              : "No matches found."}
          </p>
        ) : sortedMatches.length > 0 ? (
          <div className="match-list">
            {sortedMatches.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

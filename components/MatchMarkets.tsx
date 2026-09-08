"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  filterMarketsByCategory,
  getMarketCategoriesForMatch,
  getMarketsForMatch,
} from "@/lib/match-markets";
import { useFavouriteMarkets } from "@/lib/market-favourites";
import { isMatchLive } from "@/lib/match-status";
import { getMatchPlayers } from "@/lib/match-players";
import type { BettingMarket, MarketCategory, Match } from "@/lib/types";
import {
  formatKickoff,
  formatMatchDisplayId,
  formatMatchStartTime,
} from "@/lib/utils";
import { MarketCategoryTabs } from "./MarketCategoryTabs";
import {
  filterMarketsByQuery,
  MarketSearchBar,
  MarketSectionHeader,
} from "./MarketSectionHeader";
import { MarketOddsButton } from "./MarketOddsButton";
import { PlayerMarketBlock } from "./PlayerMarketBlock";

interface MatchMarketsProps {
  match: Match;
}

export function MatchMarkets({ match }: MatchMarketsProps) {
  const live = isMatchLive(match);
  const categories = getMarketCategoriesForMatch(match);
  const allMarkets = useMemo(() => getMarketsForMatch(match), [match]);
  const players = useMemo(() => getMatchPlayers(match), [match]);
  const [category, setCategory] = useState<MarketCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const { favourites, toggle, isFavourite } = useFavouriteMarkets();
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const categoryMarkets = useMemo(
    () => filterMarketsByCategory(allMarkets, category),
    [allMarkets, category],
  );

  const markets = useMemo(() => {
    let list = categoryMarkets;
    if (favouritesOnly) {
      const set = new Set(favourites);
      list = list.filter((market) => set.has(market.id));
    }
    return filterMarketsByQuery(list, searchQuery);
  }, [categoryMarkets, favouritesOnly, favourites, searchQuery]);

  const scrollToMarket = useCallback((marketId: string) => {
    const node = sectionRefs.current.get(marketId);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      setHighlightId(marketId);
      window.setTimeout(() => setHighlightId(null), 2000);
    }
  }, []);

  const jumpToMarket = useCallback(
    (marketId: string) => {
      setCollapsed((prev) => ({ ...prev, [marketId]: false }));
      window.requestAnimationFrame(() => scrollToMarket(marketId));
    },
    [scrollToMarket],
  );

  useEffect(() => {
    if (!searchQuery.trim() || markets.length === 0) return;
    const timer = window.setTimeout(() => {
      jumpToMarket(markets[0].id);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [searchQuery, markets, jumpToMarket]);

  const toggleCollapsed = (marketId: string) => {
    setCollapsed((prev) => ({ ...prev, [marketId]: !prev[marketId] }));
  };

  const setSectionRef = (marketId: string, node: HTMLElement | null) => {
    if (node) sectionRefs.current.set(marketId, node);
    else sectionRefs.current.delete(marketId);
  };

  const marketHeaderProps = (market: BettingMarket) => ({
    collapsed: collapsed[market.id] ?? false,
    highlighted: highlightId === market.id,
    isFavourite: isFavourite(market.id),
    onToggleCollapse: () => toggleCollapsed(market.id),
    onToggleFavourite: () => toggle(market.id),
  });

  return (
    <div
      className={
        live
          ? "-mx-3 md:-mx-0 md:overflow-hidden md:rounded-lg md:shadow-md"
          : "-mx-3 md:-mx-0 md:overflow-hidden md:rounded-lg md:border md:border-border md:shadow-sm"
      }
    >
      <div
        className={
          live
            ? "match-live-surface px-3 pb-3 pt-2"
            : "border-b border-border bg-surface px-3 pb-3 pt-2 text-foreground"
        }
      >
        <Link
          href={live ? "/live" : "/"}
          className={`mb-2 inline-flex items-center gap-1 text-xs hover:underline ${
            live ? "text-white/70 hover:text-white" : "text-muted hover:text-brand"
          }`}
        >
          ← Back
        </Link>
        <p className={`text-[11px] ${live ? "text-white/55" : "text-muted"}`}>
          ID {formatMatchDisplayId(match)}
          {!live && <> · {formatMatchStartTime(match.kickoff)}</>}
        </p>
        <p className={`text-[11px] ${live ? "text-white/55" : "text-muted"}`}>
          {match.league}
        </p>
        {match.isQualifier && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                live
                  ? "bg-white/15 text-white"
                  : "bg-brand/10 text-brand"
              }`}
            >
              Qualifier
            </span>
            {match.legInfo && (
              <span className={`text-[10px] ${live ? "text-white/55" : "text-muted"}`}>
                {match.legInfo}
              </span>
            )}
            {match.aggregateScore && (
              <span className={`text-[10px] ${live ? "text-white/55" : "text-muted"}`}>
                Agg {match.aggregateScore}
              </span>
            )}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-semibold ${
                live ? "text-white" : "text-foreground"
              }`}
            >
              {match.homeTeam}
            </p>
            <p
              className={`truncate text-sm font-semibold ${
                live ? "text-white" : "text-foreground"
              }`}
            >
              {match.awayTeam}
            </p>
          </div>
          <div className="shrink-0 text-right">
            {live ? (
              <>
                <p className="text-lg font-bold tabular-nums text-white">
                  {match.homeScore} - {match.awayScore}
                </p>
                <p className="inline-flex items-center justify-end gap-1 text-[11px] font-semibold text-live">
                  <span className="h-1.5 w-1.5 rounded-full bg-live" aria-hidden />
                  Live {match.liveMinute}&apos;
                </p>
              </>
            ) : (
              <p className="text-xs text-muted">{formatKickoff(match.kickoff)}</p>
            )}
          </div>
        </div>
      </div>

      <MarketCategoryTabs
        categories={categories}
        active={category}
        onChange={setCategory}
        live={live}
      />

      <MarketSearchBar
        query={searchQuery}
        onChange={setSearchQuery}
        favouritesOnly={favouritesOnly}
        onToggleFavouritesOnly={() => setFavouritesOnly((v) => !v)}
        favouriteCount={favourites.length}
        live={live}
      />

      <div
        className={`border-b px-3 py-1.5 ${
          live
            ? "border-white/10 bg-[var(--live-surface-deep)]"
            : "border-brand-soft bg-brand-light"
        }`}
      >
        <p className={`text-[10px] font-medium ${live ? "text-white/55" : "text-muted"}`}>
          {searchQuery.trim()
            ? `${markets.length} matching ${markets.length === 1 ? "market" : "markets"}`
            : favouritesOnly
              ? `${markets.length} favourite ${markets.length === 1 ? "market" : "markets"}`
              : category === "all"
                ? `${allMarkets.length} markets available`
                : `${markets.length} markets`}
        </p>
      </div>

      <div
        className={
          live
            ? "divide-y divide-white/10 bg-[var(--live-surface-deep)]"
            : "divide-y divide-brand-soft/70 bg-surface"
        }
      >
        {markets.length === 0 ? (
          <p
            className={`px-3 py-10 text-center text-xs ${
              live ? "text-white/55" : "text-muted"
            }`}
          >
            {favouritesOnly
              ? "No favourite markets yet. Tap ★ on any market to save it."
              : searchQuery.trim()
                ? "No markets match your search."
                : "No markets in this category."}
          </p>
        ) : (
          markets.map((market) =>
            market.layout === "players" && market.playerOddsKey ? (
              <PlayerMarketBlock
                key={market.id}
                ref={(node) => setSectionRef(market.id, node)}
                match={match}
                market={market}
                players={players}
                oddsKey={market.playerOddsKey}
                extraOutcomes={market.outcomes}
                live={live}
                {...marketHeaderProps(market)}
              />
            ) : (
              <section
                key={market.id}
                ref={(node) => setSectionRef(market.id, node)}
                className={`scroll-mt-28 ${
                  live ? "bg-[var(--live-surface-deep)]" : "bg-surface"
                }`}
              >
                <MarketSectionHeader
                  name={market.name}
                  live={live}
                  {...marketHeaderProps(market)}
                />
                {!(collapsed[market.id] ?? false) && (
                  <div
                    className={`grid gap-2 p-3 ${
                      market.outcomes.length >= 6
                        ? "grid-cols-3"
                        : market.outcomes.length >= 3
                          ? "grid-cols-3"
                          : market.outcomes.length === 2
                            ? "grid-cols-2"
                            : "grid-cols-1"
                    }`}
                  >
                    {market.outcomes.map((outcome) => (
                      <MarketOddsButton
                        key={outcome.id}
                        match={match}
                        marketId={market.id}
                        marketName={market.name}
                        outcomeId={outcome.id}
                        label={outcome.label}
                        odds={outcome.odds}
                        onLiveRow={live}
                      />
                    ))}
                  </div>
                )}
              </section>
            ),
          )
        )}
      </div>
    </div>
  );
}

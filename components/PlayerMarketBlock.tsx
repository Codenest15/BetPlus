"use client";

import { forwardRef } from "react";
import type { BettingMarket, Match } from "@/lib/types";
import { getPlayersByTeam } from "@/lib/match-players";
import type { MatchPlayer } from "@/lib/match-players";
import { MarketSectionHeader } from "./MarketSectionHeader";
import { PlayerOddsRow } from "./PlayerOddsRow";
import { MarketOddsButton } from "./MarketOddsButton";

interface PlayerMarketBlockProps {
  match: Match;
  market: BettingMarket;
  players: MatchPlayer[];
  oddsKey: keyof Pick<
    MatchPlayer,
    "anytimeOdds" | "firstOdds" | "lastOdds" | "score2Odds" | "score3Odds" | "cardOdds"
  >;
  extraOutcomes?: BettingMarket["outcomes"];
  collapsed: boolean;
  highlighted?: boolean;
  isFavourite: boolean;
  onToggleCollapse: () => void;
  onToggleFavourite: () => void;
  live?: boolean;
}

export const PlayerMarketBlock = forwardRef<HTMLElement, PlayerMarketBlockProps>(
  function PlayerMarketBlock(
    {
      match,
      market,
      players,
      oddsKey,
      extraOutcomes = [],
      collapsed,
      highlighted,
      isFavourite,
      onToggleCollapse,
      onToggleFavourite,
      live = false,
    },
    ref,
  ) {
    const { home, away } = getPlayersByTeam(players);

    return (
      <section
        ref={ref}
        className={`scroll-mt-28 ${live ? "bg-[var(--live-surface-deep)]" : "bg-surface"}`}
      >
        <MarketSectionHeader
          name={market.name}
          collapsed={collapsed}
          highlighted={highlighted}
          isFavourite={isFavourite}
          onToggleCollapse={onToggleCollapse}
          onToggleFavourite={onToggleFavourite}
          live={live}
        />

        {!collapsed && (
          <>
            <div>
              <p
                className={`border-b px-3 py-2 text-[11px] font-semibold ${
                  live
                    ? "border-white/10 bg-[var(--live-surface)] text-white/80"
                    : "border-brand-soft/40 bg-brand-light/25 text-foreground/80"
                }`}
              >
                {match.homeTeam}
              </p>
              {home.map((player) => (
                <PlayerOddsRow
                  key={`${market.id}-${player.id}`}
                  match={match}
                  marketId={market.id}
                  marketName={market.name}
                  outcomeId={`${market.id}-${player.id}`}
                  name={player.name}
                  odds={player[oddsKey]}
                  live={live}
                />
              ))}
            </div>

            <div>
              <p
                className={`border-b px-3 py-2 text-[11px] font-semibold ${
                  live
                    ? "border-white/10 bg-[var(--live-surface)] text-white/80"
                    : "border-brand-soft/40 bg-brand-light/25 text-foreground/80"
                }`}
              >
                {match.awayTeam}
              </p>
              {away.map((player) => (
                <PlayerOddsRow
                  key={`${market.id}-${player.id}`}
                  match={match}
                  marketId={market.id}
                  marketName={market.name}
                  outcomeId={`${market.id}-${player.id}`}
                  name={player.name}
                  odds={player[oddsKey]}
                  live={live}
                />
              ))}
            </div>

            {extraOutcomes.length > 0 && (
              <div
                className={`grid grid-cols-2 gap-2 border-t p-3 ${
                  live ? "border-white/10" : "border-brand-soft/50"
                }`}
              >
                {extraOutcomes.map((outcome) => (
                  <MarketOddsButton
                    key={outcome.id}
                    match={match}
                    marketId={market.id}
                    marketName={market.name}
                    outcomeId={outcome.id}
                    label={outcome.label}
                    odds={outcome.odds}
                    onLiveRow={live}
                    suspended={outcome.suspended}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    );
  },
);

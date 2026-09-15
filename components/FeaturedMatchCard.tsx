"use client";

import Link from "next/link";
import { useBetSlip } from "@/lib/betslip-context";
import {
  featuredMarketCount,
  formatFeaturedKickoffLabel,
  isHotFeaturedMatch,
} from "@/lib/featured-matches";
import { getLiveMatchOdds } from "@/lib/live-odds";
import type { Match, OddsSelection } from "@/lib/types";
import { formatMatchStartTime, formatOdds } from "@/lib/utils";
import { TeamCrest } from "./TeamCrest";

function FeaturedOddsButton({
  match,
  selection,
  label,
}: {
  match: Match;
  selection: OddsSelection;
  label: string;
}) {
  const { addSelection, isSelected } = useBetSlip();
  const odds = getLiveMatchOdds(match)[selection];
  const selected = isSelected(match.id, selection);

  if (!odds) return null;

  return (
    <button
      type="button"
      onClick={() => addSelection(match, selection)}
      className={`featured-odds-btn ${selected ? "featured-odds-btn-selected" : ""}`}
    >
      <span className="featured-odds-btn-label">{label}</span>
      <span className="featured-odds-btn-value">{formatOdds(odds)}</span>
    </button>
  );
}

function truncateTeam(name: string, max = 14) {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

export function FeaturedMatchCard({ match }: { match: Match }) {
  const hot = isHotFeaturedMatch(match);
  const marketCount = featuredMarketCount(match);
  const showDraw = match.odds.draw > 0;

  return (
    <article className="featured-match-card">
      <div className="featured-match-card-head">
        <span className="featured-match-card-tag">Best Odds</span>
        {hot && (
          <span className="featured-match-card-hot" aria-label="Hot match">
            🔥 Hot
          </span>
        )}
      </div>

      <div className="featured-match-card-teams">
        <div className="featured-match-card-side">
          <TeamCrest
            teamName={match.homeTeam}
            logoUrl={match.homeLogoUrl}
            size={40}
          />
          <p className="featured-match-card-team" title={match.homeTeam}>
            {truncateTeam(match.homeTeam)}
          </p>
        </div>

        <div className="featured-match-card-center">
          {match.isLive ? (
            <>
              <p className="featured-match-card-time tabular-nums text-live">
                {match.homeScore} - {match.awayScore}
              </p>
              <p className="featured-match-card-day text-live">Live {match.liveMinute}&apos;</p>
            </>
          ) : (
            <>
              <p className="featured-match-card-time tabular-nums">
                {formatMatchStartTime(match.kickoff)}
              </p>
              <p className="featured-match-card-day">
                {formatFeaturedKickoffLabel(match.kickoff)}
              </p>
            </>
          )}
        </div>

        <div className="featured-match-card-side">
          <TeamCrest
            teamName={match.awayTeam}
            logoUrl={match.awayLogoUrl}
            size={40}
          />
          <p className="featured-match-card-team" title={match.awayTeam}>
            {truncateTeam(match.awayTeam)}
          </p>
        </div>
      </div>

      <div className="featured-match-card-odds">
        <FeaturedOddsButton match={match} selection="home" label="1" />
        {showDraw && <FeaturedOddsButton match={match} selection="draw" label="X" />}
        <FeaturedOddsButton match={match} selection="away" label="2" />
      </div>

      <div className="featured-match-card-foot">
        <p className="featured-match-card-league">{match.league}</p>
        <Link
          href={`/match/${encodeURIComponent(match.id)}`}
          className="featured-match-card-more"
        >
          {marketCount != null
            ? `More Events(${marketCount})`
            : "More Events"}
          <span aria-hidden> ›</span>
        </Link>
      </div>
    </article>
  );
}

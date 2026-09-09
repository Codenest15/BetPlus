"use client";

import Link from "next/link";
import { TeamCrest } from "@/components/TeamCrest";
import { isMatchLive } from "@/lib/match-status";
import type { Match, Sport } from "@/lib/types";
import {
  formatMatchDetailSchedule,
  formatMatchDisplayId,
  sportLabel,
} from "@/lib/utils";

interface MatchDetailHeroProps {
  match: Match;
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-4 w-4 text-muted/50"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
    >
      {direction === "left" ? (
        <path d="M15 6l-6 6 6 6" />
      ) : (
        <path d="M9 6l6 6-6 6" />
      )}
    </svg>
  );
}

export function MatchDetailHero({ match }: MatchDetailHeroProps) {
  const live = isMatchLive(match);
  const schedule = formatMatchDetailSchedule(match.kickoff);
  const backHref = live ? "/live" : "/";

  return (
    <div
      className={
        live
          ? "match-detail-hero match-detail-hero-live"
          : "match-detail-hero"
      }
    >
      <div className="match-detail-hero-top">
        <Link
          href={backHref}
          className={`inline-flex items-center gap-1 text-xs hover:underline ${
            live ? "text-white/70 hover:text-white" : "text-muted hover:text-brand"
          }`}
        >
          ← Back
        </Link>
        <p
          className={`text-[10px] tabular-nums ${
            live ? "text-white/50" : "text-muted"
          }`}
        >
          ID {formatMatchDisplayId(match)}
        </p>
      </div>

      <p
        className={`match-detail-hero-crumb ${
          live ? "text-brand-accent" : "text-brand"
        }`}
      >
        {sportLabel(match.sport as Sport)} · {match.league}
      </p>

      <div className="match-detail-hero-stage">
        <button
          type="button"
          className="match-detail-hero-nav"
          aria-label="Previous match"
          disabled
        >
          <ChevronIcon direction="left" />
        </button>

        <div className="match-detail-hero-side">
          <div className="match-detail-hero-crest-wrap">
            <div className="match-detail-hero-watermark" aria-hidden>
              <TeamCrest
                teamName={match.homeTeam}
                logoUrl={match.homeLogoUrl}
                size={52}
                watermark
              />
            </div>
            <div className="match-detail-hero-crest">
              <TeamCrest
                teamName={match.homeTeam}
                logoUrl={match.homeLogoUrl}
                size={52}
              />
            </div>
          </div>
          <p
            className={`match-detail-hero-team ${
              live ? "text-white" : "text-foreground"
            }`}
          >
            {match.homeTeam}
          </p>
        </div>

        <div className="match-detail-hero-center">
          {live ? (
            <>
              <p className="match-detail-hero-score tabular-nums text-white">
                {match.homeScore} - {match.awayScore}
              </p>
              <p className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-live">
                <span className="h-1.5 w-1.5 rounded-full bg-live" aria-hidden />
                Live {match.liveMinute}&apos;
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {schedule.shortDate}
              </p>
              <p className="text-xs text-muted">{schedule.weekday}</p>
              <span className="match-detail-hero-time">{schedule.time}</span>
            </>
          )}
        </div>

        <div className="match-detail-hero-side">
          <div className="match-detail-hero-crest-wrap">
            <div className="match-detail-hero-watermark" aria-hidden>
              <TeamCrest
                teamName={match.awayTeam}
                logoUrl={match.awayLogoUrl}
                size={52}
                watermark
              />
            </div>
            <div className="match-detail-hero-crest">
              <TeamCrest
                teamName={match.awayTeam}
                logoUrl={match.awayLogoUrl}
                size={52}
              />
            </div>
          </div>
          <p
            className={`match-detail-hero-team ${
              live ? "text-white" : "text-foreground"
            }`}
          >
            {match.awayTeam}
          </p>
        </div>

        <button
          type="button"
          className="match-detail-hero-nav"
          aria-label="Next match"
          disabled
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      {match.isQualifier && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
              live ? "bg-white/15 text-white" : "bg-brand/10 text-brand"
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
    </div>
  );
}

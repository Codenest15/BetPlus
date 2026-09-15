import Link from "next/link";
import { AppIcon } from "@/components/AppIcon";
import type { Match } from "@/lib/types";
import type { IconId } from "@/lib/icons";
import { isMatchLive } from "@/lib/match-status";
import { formatMatchDisplayId, formatMatchStartTime } from "@/lib/utils";
import { OddsButton } from "./OddsButton";

interface MatchRowProps {
  match: Match;
  /** Show league in the meta line (e.g. live page mixed leagues). */
  showLeague?: boolean;
  /** Sport icon on the left (games page). */
  showSportThumb?: boolean;
}

const SPORT_ICONS: Record<Match["sport"], IconId> = {
  football: "football",
  basketball: "basketball",
  baseball: "baseball",
  hockey: "hockey",
};

export function MatchRow({
  match,
  showLeague = true,
  showSportThumb = false,
}: MatchRowProps) {
  const showDraw = match.sport === "football" && match.odds.draw > 0;
  const live = isMatchLive(match);
  const displayId = formatMatchDisplayId(match);

  return (
    <article className={live ? "match-row match-row-live" : "match-row"}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div
          className={`flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] ${
            live ? "text-white/55" : "text-muted"
          }`}
        >
          {live ? (
            <>
              <span className="inline-flex items-center gap-1 font-semibold text-live">
                <span className="h-1.5 w-1.5 rounded-full bg-live" aria-hidden />
                Live {match.liveMinute}&apos;
              </span>
              <span className="font-bold tabular-nums text-white">
                {match.homeScore} - {match.awayScore}
              </span>
            </>
          ) : (
            <span className="font-medium tabular-nums text-foreground">
              {formatMatchStartTime(match.kickoff)}
            </span>
          )}
          <span className={live ? "text-white/30" : "text-muted/40"}>·</span>
          <span className="tabular-nums">ID {displayId}</span>
          {showLeague && (
            <>
              <span className={live ? "text-white/30" : "text-muted/40"}>·</span>
              <span className="truncate">{match.league}</span>
            </>
          )}
          {match.isQualifier && (
            <span
              className={`rounded px-1 py-0.5 text-[9px] font-medium ${
                live
                  ? "bg-white/10 text-white/80"
                  : "bg-brand/10 text-brand"
              }`}
            >
              Qualifier
            </span>
          )}
        </div>
        <Link
          href={`/match/${encodeURIComponent(match.id)}`}
          className={`shrink-0 text-[10px] hover:underline ${
            live ? "text-white/55 hover:text-white" : "text-muted hover:text-brand"
          }`}
        >
          + markets
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {showSportThumb && (
          <AppIcon
            name={SPORT_ICONS[match.sport]}
            size={28}
            className={live ? "opacity-90" : "opacity-80"}
          />
        )}
        <Link
          href={`/match/${encodeURIComponent(match.id)}`}
          className="min-w-0 flex-1 space-y-0.5"
        >
          <p
            className={`truncate text-sm font-semibold leading-snug ${
              live ? "text-white" : "text-foreground"
            }`}
          >
            {match.homeTeam}
          </p>
          <p
            className={`truncate text-sm font-semibold leading-snug ${
              live ? "text-white" : "text-foreground"
            }`}
          >
            {match.awayTeam}
          </p>
        </Link>

        <div className="flex w-[46%] max-w-[11.5rem] shrink-0 gap-0.5 sm:w-auto sm:max-w-none">
          <OddsButton match={match} selection="home" label="1" compact onLiveRow={live} />
          {showDraw && (
            <OddsButton match={match} selection="draw" label="X" compact onLiveRow={live} />
          )}
          <OddsButton match={match} selection="away" label="2" compact onLiveRow={live} />
        </div>
      </div>
    </article>
  );
}

"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import {
  getLiveFromCatalog,
  getUpcomingFromCatalog,
} from "@/lib/catalog-filters";
import { useCatalog } from "@/lib/catalog-context";
import { formatMatchDisplayId, formatMatchStartTime } from "@/lib/utils";

export function ScoresContent() {
  const { loading, events } = useCatalog();
  const live = getLiveFromCatalog(events);
  const upcoming = getUpcomingFromCatalog(events).slice(0, 12);

  return (
    <div className="space-y-4">
      <PageHeader icon="live-scores" title="Scores" subtitle="Live and upcoming" />

      {!loading && live.length > 0 && (
        <section>
          <h2 className="section-label mb-1.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-live" />
            Live
          </h2>
          <ul className="card divide-y divide-border/60 overflow-hidden">
            {live.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/match/${encodeURIComponent(m.id)}`}
                  className="block px-3 py-2 hover:bg-surface-elevated/50"
                >
                  <p className="text-[10px] text-muted">
                    {m.league} · Live {m.liveMinute}&apos; · ID {formatMatchDisplayId(m)}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate font-medium">{m.homeTeam}</span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {m.homeScore}–{m.awayScore}
                    </span>
                    <span className="min-w-0 truncate text-right font-medium">
                      {m.awayTeam}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="section-label mb-1.5">Upcoming</h2>
        {!loading && upcoming.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted">No upcoming fixtures.</p>
        ) : (
          <ul className="card divide-y divide-border/60 overflow-hidden">
            {upcoming.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/match/${encodeURIComponent(m.id)}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-surface-elevated/50"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted">{m.league}</p>
                    <p className="truncate text-sm font-medium">
                      {m.homeTeam} vs {m.awayTeam}
                    </p>
                  </div>
                  <span className="shrink-0 text-right text-[11px] text-muted">
                    <span className="block tabular-nums font-medium text-foreground">
                      {formatMatchStartTime(m.kickoff)}
                    </span>
                    <span className="text-[10px]">ID {formatMatchDisplayId(m)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

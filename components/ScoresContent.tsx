"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { fetchCatalogEvents } from "@/lib/catalog-client";
import { useCatalog } from "@/lib/catalog-context";
import type { Match } from "@/lib/types";
import { formatMatchDisplayId, formatMatchStartTime } from "@/lib/utils";

export function ScoresContent() {
  const { error: catalogError, reload } = useCatalog();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<Match[]>([]);
  const [upcoming, setUpcoming] = useState<Match[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchCatalogEvents({ status: "live", limit: 30 }),
      fetchCatalogEvents({ status: "upcoming", limit: 12 }),
    ])
      .then(([liveResult, upcomingResult]) => {
        if (cancelled) return;
        setLive(liveResult.events);
        setUpcoming(upcomingResult.events);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load scores");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const message = error || catalogError;

  return (
    <div className="space-y-4">
      <PageHeader icon="live-scores" title="Scores" subtitle="Live and upcoming" />

      {message && live.length === 0 && upcoming.length === 0 && (
        <div className="space-y-2 py-6 text-center">
          <p className="text-xs text-muted">{message}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="text-xs font-medium text-brand"
          >
            Retry
          </button>
        </div>
      )}

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

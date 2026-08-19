"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MatchRow } from "@/components/MatchRow";
import { getMatchesForPage } from "@/lib/catalog";
import type { Match } from "@/lib/types";

export default function LivePage() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getMatchesForPage({ live: true })
      .then((data) => {
        if (!cancelled) setLiveMatches(data.filter((m) => m.isLive));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load live matches");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-3">
      <PageHeader icon="live" title="Live" subtitle="In-play markets" />

      {loading ? (
        <p className="py-8 text-center text-xs text-muted">Loading live matches…</p>
      ) : error ? (
        <p className="py-8 text-center text-xs text-live">{error}</p>
      ) : liveMatches.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface py-10 text-center text-xs text-muted">
          Nothing live right now
        </div>
      ) : (
        <section className="league-block">
          <h3 className="border-b border-border bg-surface-elevated px-3 py-2 text-xs font-semibold">
            Live now
          </h3>
          {liveMatches.map((match, index) => (
            <MatchRow key={match.id} match={match} showDivider={index > 0} />
          ))}
        </section>
      )}
    </div>
  );
}

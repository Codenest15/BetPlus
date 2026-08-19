"use client";

import { useEffect, useMemo, useState } from "react";
import { getMatchesForPage } from "@/lib/catalog";
import { deferEffect } from "@/lib/defer-effect";
import type { Match, Sport } from "@/lib/types";
import { MatchRow } from "./MatchRow";
import { SectionTabs, type SectionTab } from "./SectionTabs";
import { SportTabs } from "./SportTabs";

export function SportsHome() {
  const [sport, setSport] = useState<Sport | "all">("all");
  const [section, setSection] = useState<SectionTab>("all");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const stop = deferEffect(() => {
      getMatchesForPage({ sport })
        .then((data) => {
          if (!cancelled) setMatches(data);
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Failed to load matches");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [sport]);

  const upcoming = useMemo(() => {
    if (section === "soon") return matches.slice(0, 8);
    return matches;
  }, [matches, section]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof upcoming>();
    for (const match of upcoming) {
      const list = groups.get(match.league) ?? [];
      list.push(match);
      groups.set(match.league, list);
    }
    return Array.from(groups.entries());
  }, [upcoming]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-surface">
        <SectionTabs active={section} onChange={setSection} />
        <div className="border-t border-border px-3 py-2">
          <SportTabs active={sport} onChange={setSport} />
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-xs text-muted">Loading matches…</p>
      ) : error ? (
        <p className="py-8 text-center text-xs text-live">{error}</p>
      ) : grouped.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted">No matches found.</p>
      ) : (
        grouped.map(([league, leagueMatches]) => (
          <section key={league} className="league-block">
            <h3 className="border-b border-border bg-surface-elevated px-3 py-2 text-xs font-semibold">
              {league}
            </h3>
            {leagueMatches.map((match, index) => (
              <MatchRow
                key={match.id}
                match={match}
                showDivider={index > 0}
              />
            ))}
          </section>
        ))
      )}
    </div>
  );
}

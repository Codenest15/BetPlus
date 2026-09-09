"use client";

import { useMemo, useState } from "react";
import {
  getFeaturedLeagueTabs,
  getFeaturedMatches,
} from "@/lib/featured-matches";
import type { CatalogLeague } from "@/lib/catalog-types";
import type { Match } from "@/lib/types";
import { FeaturedMatchCard } from "./FeaturedMatchCard";
import { LeagueLogo } from "./LeagueLogo";
import { ScrollRow } from "./ScrollRow";

interface FeaturedMatchesProps {
  events: Match[];
  leagues?: CatalogLeague[];
}

export function FeaturedMatches({ events, leagues = [] }: FeaturedMatchesProps) {
  const tabs = useMemo(
    () => getFeaturedLeagueTabs(events, leagues),
    [events, leagues],
  );

  const [activeTab, setActiveTab] = useState("all");

  const activeId = tabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : (tabs[0]?.id ?? "all");

  const matches = useMemo(
    () => getFeaturedMatches(events, activeId),
    [events, activeId],
  );

  if (tabs.length === 0 || matches.length === 0) return null;

  return (
    <section className="featured-matches" aria-label="Featured matches">
      <div className="featured-matches-header">
        <div className="featured-matches-title-wrap">
          <span className="featured-matches-icon" aria-hidden>
            ⚡
          </span>
          <h2 className="featured-matches-title">Featured Matches</h2>
        </div>
        <div className="featured-matches-title-line" aria-hidden />
      </div>

      <ScrollRow fadeEdge trackClassName="gap-2 py-1">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={
                active
                  ? "featured-league-tab featured-league-tab-active"
                  : "featured-league-tab"
              }
              title={tab.label}
            >
              {tab.id !== "all" && (
                <LeagueLogo tabId={tab.id} leagueName={tab.label} size={16} />
              )}
              {tab.shortLabel}
            </button>
          );
        })}
      </ScrollRow>

      <ScrollRow fadeEdge trackClassName="gap-3 py-2">
        {matches.map((match) => (
          <FeaturedMatchCard key={match.id} match={match} />
        ))}
      </ScrollRow>
    </section>
  );
}

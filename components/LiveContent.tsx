"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MatchListSkeleton } from "@/components/MatchListSkeleton";
import { MatchRow } from "@/components/MatchRow";
import { CATALOG_PAGE_SIZE } from "@/lib/catalog-client";
import { useCatalog } from "@/lib/catalog-context";

const LIVE_QUERY = { status: "live" as const, limit: CATALOG_PAGE_SIZE };

export function LiveContent() {
  const { loading, error, events, loadEvents, reload } = useCatalog();

  useEffect(() => {
    void loadEvents(LIVE_QUERY);
    const tick = () => {
      if (document.visibilityState === "hidden") return;
      void loadEvents(LIVE_QUERY, { force: true });
    };
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [loadEvents]);

  return (
    <div className="-mx-3 space-y-0 sm:mx-0">
      <div className="px-3 sm:px-0">
        <PageHeader icon="live" title="Live" plainIcon />
      </div>

      {error && events.length === 0 ? (
        <div className="home-feed space-y-2 py-10 text-center">
          <p className="text-xs text-muted">{error}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="text-xs font-medium text-brand"
          >
            Retry
          </button>
        </div>
      ) : loading && events.length === 0 ? (
        <MatchListSkeleton />
      ) : events.length === 0 ? (
        <div className="home-feed py-10 text-center text-xs text-muted">
          No live matches available.
        </div>
      ) : (
        <div className="home-feed match-list">
          {events.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

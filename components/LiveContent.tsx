"use client";

import { PageHeader } from "@/components/PageHeader";
import { MatchRow } from "@/components/MatchRow";
import { getLiveFromCatalog } from "@/lib/catalog-filters";
import { useCatalog } from "@/lib/catalog-context";

export function LiveContent() {
  const { loading, events } = useCatalog();
  const liveMatches = getLiveFromCatalog(events);

  return (
    <div className="-mx-3 space-y-0 sm:mx-0">
      <div className="px-3 sm:px-0">
        <PageHeader icon="live" title="Live" plainIcon />
      </div>

      {!loading && liveMatches.length === 0 ? (
        <div className="home-feed py-10 text-center text-xs text-muted">
          Nothing live right now
        </div>
      ) : liveMatches.length > 0 ? (
        <div className="home-feed match-list">
          {liveMatches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

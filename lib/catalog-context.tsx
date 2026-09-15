"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchCatalogLeagueEvents,
  loadCatalogPipeline,
} from "./catalog-client";
import type { CatalogLeague, CatalogPayload } from "./catalog-types";
import type { Match } from "./types";

interface CatalogContextValue {
  loading: boolean;
  error: string | null;
  source: CatalogPayload["source"] | null;
  steps: CatalogPayload["steps"];
  sports: CatalogPayload["sports"];
  leagues: CatalogLeague[];
  events: Match[];
  loadingLeagueId: number | null;
  reload: () => Promise<void>;
  loadLeagueEvents: (leagueId: number) => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

function mergeLeagueEvents(existing: Match[], leagueId: number, incoming: Match[]) {
  const rest = existing.filter((event) => event.leagueId !== leagueId);
  const byId = new Map<string, Match>();
  for (const event of [...rest, ...incoming]) {
    byId.set(event.id, event);
  }
  return [...byId.values()].sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
  });
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<CatalogPayload | null>(null);
  const [loadingLeagueId, setLoadingLeagueId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadCatalogPipeline();
      setPayload(data);
    } catch {
      setPayload({
        source: "mock",
        sports: [],
        leagues: [],
        events: [],
        steps: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLeagueEvents = useCallback(async (leagueId: number) => {
    setLoadingLeagueId(leagueId);
    try {
      const leagueEvents = await fetchCatalogLeagueEvents(leagueId);
      setPayload((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          events: mergeLeagueEvents(prev.events, leagueId, leagueEvents),
        };
      });
    } catch {
      // Keep existing events — no user-facing error.
    } finally {
      setLoadingLeagueId((current) => (current === leagueId ? null : current));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<CatalogContextValue>(() => {
    return {
      loading,
      error,
      source: payload?.source ?? null,
      steps: payload?.steps ?? [],
      sports: payload?.sports ?? [],
      leagues: payload?.leagues ?? [],
      events: payload?.events ?? [],
      loadingLeagueId,
      reload,
      loadLeagueEvents,
    };
  }, [loading, error, payload, loadingLeagueId, reload, loadLeagueEvents]);

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return ctx;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CATALOG_PAGE_SIZE,
  fetchCatalogEvents,
  loadCatalogBootstrap,
} from "./catalog-client";
import type {
  CatalogEventQuery,
  CatalogLeague,
  CatalogPayload,
} from "./catalog-types";
import type { Match } from "./types";

const LIVE_STALE_MS = 8_000;
const LIST_STALE_MS = 45_000;

interface CatalogContextValue {
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  source: CatalogPayload["source"] | null;
  steps: CatalogPayload["steps"];
  sports: CatalogPayload["sports"];
  leagues: CatalogLeague[];
  events: Match[];
  allEvents: Match[];
  loadingLeagueId: number | null;
  reload: () => Promise<void>;
  loadEvents: (
    query: CatalogEventQuery,
    options?: { append?: boolean; force?: boolean },
  ) => Promise<void>;
  loadLeagueEvents: (leagueId: number) => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

function viewKey(query: CatalogEventQuery) {
  return JSON.stringify({
    status: query.status ?? null,
    sport: query.sport && query.sport !== "all" ? query.sport : null,
    leagueId: query.leagueId ?? null,
    date: query.date ?? null,
    search: query.search?.trim() || null,
    windowDays: query.windowDays ?? null,
  });
}

function staleMs(query: CatalogEventQuery) {
  return query.status === "live" ? LIVE_STALE_MS : LIST_STALE_MS;
}

type ViewCache = {
  events: Match[];
  hasMore: boolean;
  fetchedAt: number;
};

function mergeMatches(existing: Match[], incoming: Match[]) {
  const byId = new Map<string, Match>();
  for (const event of [...existing, ...incoming]) {
    byId.set(event.id, event);
  }
  return [...byId.values()];
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [bootLoading, setBootLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<CatalogPayload["source"] | null>(null);
  const [steps, setSteps] = useState<CatalogPayload["steps"]>([]);
  const [sports, setSports] = useState<CatalogPayload["sports"]>([]);
  const [leagues, setLeagues] = useState<CatalogLeague[]>([]);
  const [allEvents, setAllEvents] = useState<Match[]>([]);
  const [activeKey, setActiveKey] = useState("");
  const [loadingLeagueId, setLoadingLeagueId] = useState<number | null>(null);
  const cacheRef = useRef<Map<string, ViewCache>>(new Map());
  const matchesByIdRef = useRef<Map<string, Match>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const [, setTick] = useState(0);

  const bump = useCallback(() => setTick((n) => n + 1), []);

  const events = useMemo(() => {
    return cacheRef.current.get(activeKey)?.events ?? [];
  }, [activeKey, loading, loadingMore, bootLoading]);

  const hasMore = cacheRef.current.get(activeKey)?.hasMore ?? false;

  const remember = useCallback((incoming: Match[]) => {
    for (const event of incoming) {
      matchesByIdRef.current.set(event.id, event);
    }
    setAllEvents([...matchesByIdRef.current.values()]);
  }, []);

  const bootstrap = useCallback(async () => {
    setBootLoading(true);
    setError(null);
    try {
      const data = await loadCatalogBootstrap();
      setSource(data.source);
      setSports(data.sports);
      setLeagues(data.leagues);
      setSteps(data.steps);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Catalog failed");
      setSource("mock");
    } finally {
      setBootLoading(false);
    }
  }, []);

  const loadEvents = useCallback(
    async (
      query: CatalogEventQuery,
      options?: { append?: boolean; force?: boolean },
    ) => {
      const key = viewKey(query);
      const cached = cacheRef.current.get(key);
      const append = options?.append === true;
      const now = Date.now();

      if (
        !append &&
        !options?.force &&
        cached &&
        now - cached.fetchedAt < staleMs(query)
      ) {
        setActiveKey(key);
        setError(null);
        bump();
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setActiveKey(key);
      setError(null);
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const offset = append ? (cached?.events.length ?? 0) : 0;
        const result = await fetchCatalogEvents(
          {
            ...query,
            limit: query.limit ?? CATALOG_PAGE_SIZE,
            offset,
          },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        const events = append
          ? mergeMatches(cached?.events ?? [], result.events)
          : result.events;
        cacheRef.current.set(key, {
          events,
          hasMore: result.hasMore,
          fetchedAt: Date.now(),
        });
        remember(result.events);
        if (result.source) setSource(result.source);
        bump();
      } catch (err) {
        if (controller.signal.aborted) return;
        if (!cached) {
          setError(err instanceof Error ? err.message : "Failed to load matches");
        }
      } finally {
        if (abortRef.current === controller) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [bump, remember],
  );

  const loadLeagueEvents = useCallback(
    async (leagueId: number) => {
      setLoadingLeagueId(leagueId);
      try {
        await loadEvents(
          { leagueId, status: "upcoming", limit: CATALOG_PAGE_SIZE },
          { force: true },
        );
      } finally {
        setLoadingLeagueId((current) => (current === leagueId ? null : current));
      }
    },
    [loadEvents],
  );

  const reload = useCallback(async () => {
    cacheRef.current.clear();
    await bootstrap();
    if (activeKey) {
      const parsed = JSON.parse(activeKey || "{}") as CatalogEventQuery;
      await loadEvents(parsed, { force: true });
    }
  }, [activeKey, bootstrap, loadEvents]);

  useEffect(() => {
    void bootstrap();
    return () => abortRef.current?.abort();
  }, [bootstrap]);

  const value = useMemo<CatalogContextValue>(() => {
    return {
      loading: bootLoading || loading,
      loadingMore,
      hasMore,
      error,
      source,
      steps,
      sports,
      leagues,
      events,
      allEvents,
      loadingLeagueId,
      reload,
      loadEvents,
      loadLeagueEvents,
    };
  }, [
    bootLoading,
    loading,
    loadingMore,
    hasMore,
    error,
    source,
    steps,
    sports,
    leagues,
    events,
    allEvents,
    loadingLeagueId,
    reload,
    loadEvents,
    loadLeagueEvents,
  ]);

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

/** All matches seen this session — bet slip odds refresh. */
export function useCatalogMatchIndex() {
  const ctx = useContext(CatalogContext);
  return ctx?.allEvents ?? [];
}

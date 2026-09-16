"use client";

import {
  mockCatalogEvents,
  mockCatalogSports,
} from "./catalog-normalize";
import type {
  CatalogEventQuery,
  CatalogLeague,
  CatalogPayload,
  CatalogPipelineStep,
} from "./catalog-types";
import type { Match } from "./types";

export const CATALOG_PAGE_SIZE = 30;

async function readJson<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("invalid response");
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new Error("invalid response");
  }
}

function mockCatalogPayload(): CatalogPayload {
  return {
    source: "mock",
    sports: mockCatalogSports(),
    leagues: [],
    events: mockCatalogEvents(),
    steps: [],
  };
}

const FOOTBALL_SPORT_ID = 5;

let authReady: Promise<void> | null = null;

async function ensureCatalogAuth(): Promise<void> {
  if (!authReady) {
    authReady = (async () => {
      const authRes = await fetch("/api/catalog/auth", {
        method: "POST",
        credentials: "include",
      });
      const authBody = await readJson<{ ok: boolean; error?: string }>(authRes);
      if (!authRes.ok || !authBody.ok) {
        authReady = null;
        throw new Error(authBody.error ?? "Catalog auth failed");
      }
    })();
  }
  return authReady;
}

export async function loadCatalogBootstrap(): Promise<
  Omit<CatalogPayload, "events">
> {
  const steps: CatalogPipelineStep[] = [];
  await ensureCatalogAuth();

  const sportsRes = await fetch("/api/catalog/sports", { credentials: "include" });
  const sportsBody = await readJson<{
    ok: boolean;
    sports: CatalogPayload["sports"];
    source?: "api" | "mock";
    ms?: number;
    error?: string;
  }>(sportsRes);
  steps.push({
    step: "sports",
    ok: sportsRes.ok && sportsBody.ok,
    ms: sportsBody.ms ?? 0,
    error: sportsBody.error,
  });
  if (!sportsRes.ok || !sportsBody.ok) {
    throw new Error(sportsBody.error ?? "Catalog sports failed");
  }

  const leaguesRes = await fetch(
    `/api/catalog/leagues?sport_id=${FOOTBALL_SPORT_ID}`,
    { credentials: "include" },
  );
  const leaguesBody = await readJson<{
    ok: boolean;
    leagues?: CatalogLeague[];
    source?: "api" | "mock";
    ms?: number;
    error?: string;
  }>(leaguesRes);

  const source =
    sportsBody.source === "api" || leaguesBody.source === "api" ? "api" : "mock";

  return {
    source,
    sports: sportsBody.sports,
    leagues: leaguesBody.ok ? (leaguesBody.leagues ?? []) : [],
    steps,
  };
}

export async function fetchCatalogEvents(
  query: CatalogEventQuery,
  signal?: AbortSignal,
): Promise<{ events: Match[]; hasMore: boolean; source: "api" | "mock" }> {
  await ensureCatalogAuth();
  const params = new URLSearchParams();
  const limit = query.limit ?? CATALOG_PAGE_SIZE;
  params.set("limit", String(limit));
  if (query.offset) params.set("offset", String(query.offset));
  if (query.status) params.set("status", query.status);
  if (query.sport && query.sport !== "all") params.set("sport", query.sport);
  if (query.leagueId) params.set("league_id", String(query.leagueId));
  if (query.date) params.set("date", query.date);
  if (query.search) params.set("search", query.search);
  if (query.windowDays) params.set("window_days", String(query.windowDays));

  const res = await fetch(`/api/catalog/events?${params.toString()}`, {
    credentials: "include",
    signal,
  });
  const body = await readJson<{
    ok: boolean;
    events?: Match[];
    hasMore?: boolean;
    source?: "api" | "mock";
    error?: string;
  }>(res);

  if (!res.ok || !body.ok) {
    throw new Error(body.error ?? "Failed to load fixtures");
  }

  const events = body.events ?? [];
  return {
    events,
    hasMore: body.hasMore ?? events.length >= limit,
    source: body.source ?? "api",
  };
}

/** Load sports + fixtures for home, live, scores, and leagues. */
export async function loadCatalogPipeline(): Promise<CatalogPayload> {
  try {
    const boot = await loadCatalogBootstrap();
    const { events, source } = await fetchCatalogEvents({
      status: "all",
      limit: CATALOG_PAGE_SIZE,
    });
    return {
      ...boot,
      source: source === "api" || boot.source === "api" ? "api" : "mock",
      events,
    };
  } catch {
    return mockCatalogPayload();
  }
}

/** Fetch full schedule for one league from BetPlus (same source as live/odds). */
export async function fetchCatalogLeagueEvents(leagueId: number): Promise<Match[]> {
  try {
    const { events } = await fetchCatalogEvents({
      leagueId,
      status: "upcoming",
      limit: 100,
    });
    return events;
  } catch {
    return mockCatalogEvents().filter((event) => event.leagueId === leagueId);
  }
}

export {
  getAllFromCatalog,
  getLiveFromCatalog,
  getTodayFromCatalog,
  getUpcomingFromCatalog,
} from "./catalog-filters";

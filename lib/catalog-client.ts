"use client";

import {
  mockCatalogEvents,
  mockCatalogSports,
} from "./catalog-normalize";
import type { CatalogLeague, CatalogPayload, CatalogPipelineStep } from "./catalog-types";
import type { Match } from "./types";

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

/** Football sport id on BetPlus catalog (used for league list). */
const FOOTBALL_SPORT_ID = 5;

async function loadCatalogPipelineFromApi(): Promise<CatalogPayload> {
  const steps: CatalogPipelineStep[] = [];

  const authRes = await fetch("/api/catalog/auth", {
    method: "POST",
    credentials: "include",
  });
  const authBody = await readJson<{
    ok: boolean;
    step: "auth";
    source?: "api" | "mock";
    ms?: number;
    error?: string;
  }>(authRes);

  steps.push({
    step: "auth",
    ok: authRes.ok && authBody.ok,
    ms: authBody.ms ?? 0,
    error: authBody.error,
  });
  if (!authRes.ok || !authBody.ok) {
    throw new Error(authBody.error ?? "Catalog auth failed");
  }

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

  const eventsRes = await fetch("/api/catalog/events", { credentials: "include" });
  const eventsBody = await readJson<{
    ok: boolean;
    events: Match[];
    source?: "api" | "mock";
    ms?: number;
    error?: string;
  }>(eventsRes);
  steps.push({
    step: "events",
    ok: eventsRes.ok && eventsBody.ok,
    ms: eventsBody.ms ?? 0,
    error: eventsBody.error,
  });
  if (!eventsRes.ok || !eventsBody.ok) {
    throw new Error(eventsBody.error ?? "Catalog events failed");
  }

  const source =
    authBody.source === "api" ||
    sportsBody.source === "api" ||
    leaguesBody.source === "api" ||
    eventsBody.source === "api"
      ? "api"
      : "mock";

  return {
    source,
    sports: sportsBody.sports,
    leagues: leaguesBody.ok ? (leaguesBody.leagues ?? []) : [],
    events: eventsBody.events ?? [],
    steps,
  };
}

/** Load sports + fixtures for home, live, scores, and leagues. */
export async function loadCatalogPipeline(): Promise<CatalogPayload> {
  try {
    return await loadCatalogPipelineFromApi();
  } catch {
    return mockCatalogPayload();
  }
}

/** Fetch full schedule for one league from BetPlus (same source as live/odds). */
export async function fetchCatalogLeagueEvents(leagueId: number): Promise<Match[]> {
  try {
    const res = await fetch(`/api/catalog/events?league_id=${leagueId}`, {
      credentials: "include",
    });
    const body = await readJson<{
      ok: boolean;
      events?: Match[];
      error?: string;
    }>(res);

    if (!res.ok || !body.ok) {
      throw new Error(body.error ?? "Failed to load league fixtures");
    }

    return body.events ?? [];
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

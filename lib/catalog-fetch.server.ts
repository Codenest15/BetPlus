import { cookies } from "next/headers";
import {
  CATALOG_TOKEN_COOKIE,
  getCatalogApiConfig,
} from "./catalog-config.server";
import {
  mockCatalogEvents,
  mockCatalogGames,
  mockCatalogSports,
  normalizeCatalogGame,
  normalizeGames,
  normalizeLeagues,
  normalizeSports,
} from "./catalog-normalize";
import type { CatalogLeague, CatalogSport } from "./catalog-types";
import type { RemoteCatalogGame } from "./catalog-types";
import type { Game } from "./games-data";
import type { Match } from "./types";

async function upstreamFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  const { baseUrl, apiKey } = getCatalogApiConfig();
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (token && token !== "public" && token !== "mock") {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (apiKey) headers.set("X-API-Key", apiKey);

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function getStoredCatalogToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(CATALOG_TOKEN_COOKIE)?.value ?? null;
}

export async function setStoredCatalogToken(token: string) {
  const jar = await cookies();
  jar.set(CATALOG_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });
}

export async function clearStoredCatalogToken() {
  const jar = await cookies();
  jar.delete(CATALOG_TOKEN_COOKIE);
}

/** Step 1 — prepare catalog session (BetPlus catalog is public; no upstream auth). */
export async function catalogAuthStep(): Promise<{ token: string; source: "api" | "mock" }> {
  const config = getCatalogApiConfig();

  if (!config.enabled) {
    const token = "mock";
    await setStoredCatalogToken(token);
    return { token, source: "mock" };
  }

  if (!config.requiresAuth) {
    const token = "public";
    await setStoredCatalogToken(token);
    return { token, source: "api" };
  }

  const res = await upstreamFetch(config.authPath, "", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: config.apiKey }),
  });

  if (!res.ok) {
    throw new Error(`Catalog auth failed (${res.status})`);
  }

  const body = (await res.json()) as { token?: string; access_token?: string };
  const token = body.token ?? body.access_token;
  if (!token) {
    throw new Error("Catalog auth response missing token");
  }

  await setStoredCatalogToken(token);
  return { token, source: "api" };
}

/** Step 2 — sports list. */
export async function catalogSportsStep(token: string): Promise<{
  sports: CatalogSport[];
  source: "api" | "mock";
}> {
  const config = getCatalogApiConfig();
  if (!config.enabled || token === "mock") {
    return { sports: mockCatalogSports(), source: "mock" };
  }

  const res = await upstreamFetch(config.sportsPath, token);
  if (!res.ok) throw new Error(`Catalog sports failed (${res.status})`);
  const body = await res.json();
  return { sports: normalizeSports(body), source: "api" };
}

/** Leagues for a sport (BetPlus `/catalog/leagues?sport_id=`). */
export async function catalogLeaguesStep(
  token: string,
  sportId?: number,
): Promise<{ leagues: CatalogLeague[]; source: "api" | "mock" }> {
  const config = getCatalogApiConfig();
  if (!config.enabled || token === "mock") {
    return { leagues: [], source: "mock" };
  }

  const path =
    typeof sportId === "number"
      ? `${config.leaguesPath}?sport_id=${sportId}`
      : config.leaguesPath;
  const res = await upstreamFetch(path, token);
  if (!res.ok) throw new Error(`Catalog leagues failed (${res.status})`);
  const body = await res.json();
  return { leagues: normalizeLeagues(body, sportId), source: "api" };
}

async function fetchMatchesForLeague(
  token: string,
  leagueId: number,
): Promise<RemoteCatalogGame[]> {
  const config = getCatalogApiConfig();
  const res = await upstreamFetch(
    `${config.matchesPath}?league_id=${leagueId}`,
    token,
  );
  if (!res.ok) return [];
  const body = (await res.json()) as RemoteCatalogGame[];
  return Array.isArray(body) ? body : [];
}

/** Step 3 — sports fixtures (BetPlus `/catalog/games`). */
export async function catalogEventsStep(
  token: string,
  options?: { sport?: string; leagueId?: number },
): Promise<{ events: Match[]; source: "api" | "mock" }> {
  const config = getCatalogApiConfig();
  const sport = options?.sport;
  const leagueId = options?.leagueId;

  if (!config.enabled || token === "mock") {
    let events = mockCatalogEvents();
    if (sport && sport !== "all") {
      events = events.filter((event) => event.sport === sport);
    }
    if (leagueId) {
      events = events.filter((event) => event.leagueId === leagueId);
    }
    return { events, source: "mock" };
  }

  if (typeof leagueId === "number") {
    const batch = await fetchMatchesForLeague(token, leagueId);
    let events = batch.map((item, index) => normalizeCatalogGame(item, index));
    if (sport && sport !== "all") {
      events = events.filter((event) => event.sport === sport);
    }
    return { events, source: "api" };
  }

  const leagueIds = config.featuredLeagueIds;
  if (leagueIds.length === 0) {
    throw new Error("No featured leagues configured for catalog fetch");
  }

  let events = await fetchAllCatalogMatches(token);
  if (sport && sport !== "all") {
    events = events.filter((event) => event.sport === sport);
  }

  return { events, source: "api" };
}

async function fetchAllCatalogMatches(token: string): Promise<Match[]> {
  const config = getCatalogApiConfig();
  const batches = await Promise.all(
    config.featuredLeagueIds.map((leagueId) =>
      fetchMatchesForLeague(token, leagueId),
    ),
  );

  const byExternalId = new Map<string, Match>();
  for (const batch of batches) {
    for (const [index, item] of batch.entries()) {
      const match = normalizeCatalogGame(item, index);
      byExternalId.set(match.id, match);
    }
  }

  return [...byExternalId.values()].sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
  });
}

/** Casino/virtual games for `/games` — not sports fixtures (those use `/catalog/events`). */
export async function catalogGamesStep(token: string): Promise<{
  games: Game[];
  source: "api" | "mock";
}> {
  return { games: mockCatalogGames(), source: "mock" };
}

/** Fetch a single fixture by external id for match detail pages. */
export async function catalogMatchByIdStep(
  externalId: string,
): Promise<{ match: Match | null; source: "api" | "mock" }> {
  const config = getCatalogApiConfig();
  if (!config.enabled) {
    return { match: null, source: "mock" };
  }

  const token = (await getStoredCatalogToken()) ?? "public";
  const encoded = encodeURIComponent(externalId);
  const res = await upstreamFetch(`${config.matchDetailPath}/${encoded}`, token);

  if (!res.ok) {
    return { match: null, source: "api" };
  }

  const body = (await res.json()) as RemoteCatalogGame;
  return { match: normalizeCatalogGame(body), source: "api" };
}

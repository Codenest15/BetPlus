import { isBackendEnabled } from "./backend-client";
import type { BettingMarket, Match, Sport } from "./types";
import { getLiveMatches, getMatchById, getUpcomingMatches, MATCHES } from "./mock-data";
import { getMatchesForLeague } from "./leagues-utils";

export interface BackendCatalogGame {
  id: number;
  external_id: string;
  league_id: number;
  league_name?: string | null;
  sport?: string | null;
  home: string;
  away: string;
  home_abbr?: string | null;
  away_abbr?: string | null;
  starts_at?: string | null;
  status: string;
  is_live: boolean;
  live_minute?: number | null;
  home_score?: number | null;
  away_score?: number | null;
  odds_home?: number | null;
  odds_draw?: number | null;
  odds_away?: number | null;
  markets?: BettingMarket[];
}

interface BackendCatalogSport {
  id: number;
  name: string;
  slug: string;
}

interface BackendCatalogLeague {
  id: number;
  sport_id: number;
  name: string;
  slug: string;
}

function catalogOrigin(): string {
  if (typeof window === "undefined") {
    return process.env.BACKEND_URL ?? "http://localhost:8000";
  }
  return "";
}

export function backendGameToMatch(g: BackendCatalogGame): Match {
  const sport = (g.sport as Sport) || "football";
  return {
    id: g.external_id,
    sport,
    league: g.league_name || "",
    homeTeam: g.home,
    awayTeam: g.away,
    homeAbbr: g.home_abbr || g.home.slice(0, 3).toUpperCase(),
    awayAbbr: g.away_abbr || g.away.slice(0, 3).toUpperCase(),
    kickoff: g.starts_at || new Date().toISOString(),
    isLive: Boolean(g.is_live) || g.status === "live",
    liveMinute: g.live_minute ?? undefined,
    homeScore: g.home_score ?? undefined,
    awayScore: g.away_score ?? undefined,
    odds: {
      home: g.odds_home ?? 0,
      draw: g.odds_draw ?? 0,
      away: g.odds_away ?? 0,
    },
    markets: g.markets,
  };
}

async function fetchCatalogJson<T>(path: string): Promise<T> {
  const res = await fetch(`${catalogOrigin()}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load match catalog");
  return (await res.json()) as T;
}

async function resolveBackendLeagueId(
  leagueSlug: string,
  sportSlug: Sport,
): Promise<number | null> {
  const sports = await fetchCatalogJson<BackendCatalogSport[]>(
    "/api/v1/catalog/sports",
  );
  const sport = sports.find((entry) => entry.slug === sportSlug);
  if (!sport) return null;

  const leagues = await fetchCatalogJson<BackendCatalogLeague[]>(
    `/api/v1/catalog/leagues?sport_id=${sport.id}`,
  );
  const league = leagues.find(
    (entry) => entry.slug === leagueSlug || entry.name === leagueSlug,
  );
  return league?.id ?? null;
}

async function confirmBackendLeague(
  leagueId: number,
  sportSlug: string,
): Promise<boolean> {
  const sports = await fetchCatalogJson<BackendCatalogSport[]>(
    "/api/v1/catalog/sports",
  );
  const sport = sports.find((entry) => entry.slug === sportSlug);
  if (!sport) return false;

  const leagues = await fetchCatalogJson<BackendCatalogLeague[]>(
    `/api/v1/catalog/leagues?sport_id=${sport.id}`,
  );
  return leagues.some((entry) => entry.id === leagueId);
}

export async function fetchCatalogGames(options?: {
  leagueId?: number;
  leagueSlug?: string;
  sport?: string;
  live?: boolean;
}): Promise<Match[]> {
  const origin = catalogOrigin();
  const qs = new URLSearchParams();
  let leagueId: number | null | undefined = options?.leagueId;
  if (options?.leagueSlug && options.sport) {
    leagueId = await resolveBackendLeagueId(
      options.leagueSlug,
      options.sport as Sport,
    );
    if (leagueId === null) return [];
  }
  if (leagueId !== undefined) {
    if (
      !options?.sport ||
      (options.leagueSlug === undefined &&
        !(await confirmBackendLeague(leagueId, options.sport)))
    ) {
      return [];
    }
    qs.set("league_id", String(leagueId));
  }
  if (options?.sport) qs.set("sport", options.sport);
  if (options?.live) qs.set("live", "true");
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`${origin}/api/v1/catalog/games${suffix}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load match catalog");
  }
  const data = (await res.json()) as BackendCatalogGame[];
  return data.map(backendGameToMatch);
}

export async function fetchCatalogGame(id: string): Promise<Match | null> {
  const origin = catalogOrigin();
  const res = await fetch(`${origin}/api/v1/catalog/games/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load match");
  return backendGameToMatch((await res.json()) as BackendCatalogGame);
}

export async function getMatchesForPage(options?: {
  sport?: Sport | "all";
  live?: boolean;
  leagueName?: string;
}): Promise<Match[]> {
  if (isBackendEnabled()) {
    const sport =
      options?.sport && options.sport !== "all" ? options.sport : undefined;
    let matches = await fetchCatalogGames({ sport, live: options?.live });
    if (options?.leagueName) {
      const wanted = options.leagueName.toLowerCase();
      matches = matches.filter((m) => m.league.toLowerCase() === wanted);
    }
    return matches;
  }
  if (options?.live) return getLiveMatches();
  if (options?.leagueName) {
    // Demo-only league helper still uses mock fixtures.
    return MATCHES.filter((m) => m.league === options.leagueName);
  }
  return getUpcomingMatches(
    options?.sport && options.sport !== "all" ? options.sport : undefined,
  );
}

export async function getMatchForPage(id: string): Promise<Match | null> {
  if (isBackendEnabled()) {
    return fetchCatalogGame(id);
  }
  return getMatchById(id) ?? null;
}

export async function getLeagueMatchesForPage(
  leagueId: string,
  _leagueName: string,
  sport: Sport,
): Promise<Match[]> {
  if (isBackendEnabled()) {
    return fetchCatalogGames({ leagueSlug: leagueId, sport });
  }
  return getMatchesForLeague(leagueId);
}

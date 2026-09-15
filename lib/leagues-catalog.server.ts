import { countryDisplayName, countryFlagCode } from "./catalog-country";
import { getCatalogApiConfig } from "./catalog-config.server";
import { getFeaturedLeagueIds } from "./catalog-featured";
import { normalizeLeagues } from "./catalog-normalize";
import type { CatalogLeague } from "./catalog-types";
import { catalogEventsStep } from "./catalog-fetch.server";
import type { Sport } from "./types";

/** BetPlus catalog sport ids (from `/catalog/sports`). */
const CATALOG_SPORT_ID: Partial<Record<Sport, number>> = {
  football: 5,
};

export interface CatalogCountryEntry {
  id: string;
  name: string;
  flagCode: string;
  leagueCount: number;
}

async function upstreamLeagues(sportId: number): Promise<CatalogLeague[]> {
  const config = getCatalogApiConfig();
  if (!config.enabled) return [];

  const res = await fetch(
    `${config.baseUrl}${config.leaguesPath}?sport_id=${sportId}`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 600 },
    },
  );

  if (!res.ok) return [];
  const body = await res.json();
  return normalizeLeagues(body, sportId);
}

export function catalogSportIdFor(sport: Sport): number | undefined {
  return CATALOG_SPORT_ID[sport];
}

export async function fetchCatalogLeaguesForSport(
  sport: Sport,
): Promise<CatalogLeague[]> {
  const sportId = catalogSportIdFor(sport);
  if (!sportId) return [];
  return upstreamLeagues(sportId);
}

export function countriesFromCatalogLeagues(
  leagues: CatalogLeague[],
): CatalogCountryEntry[] {
  const counts = new Map<string, number>();
  for (const league of leagues) {
    counts.set(league.countrySlug, (counts.get(league.countrySlug) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([id, leagueCount]) => ({
      id,
      name: countryDisplayName(id),
      flagCode: countryFlagCode(id),
      leagueCount,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function catalogLeaguesForCountry(
  leagues: CatalogLeague[],
  countrySlug: string,
): CatalogLeague[] {
  return leagues
    .filter((league) => league.countrySlug === countrySlug)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function catalogLeagueById(
  leagues: CatalogLeague[],
  leagueId: number,
): CatalogLeague | undefined {
  return leagues.find((league) => league.id === leagueId);
}

export function featuredCatalogLeagues(
  leagues: CatalogLeague[],
): CatalogLeague[] {
  return getFeaturedLeagueIds()
    .map((id) => leagues.find((league) => league.id === id))
    .filter((league): league is CatalogLeague => Boolean(league));
}

export async function fetchCatalogMatchesForLeague(leagueId: number) {
  const config = getCatalogApiConfig();
  if (!config.enabled) return [];

  const { events } = await catalogEventsStep("public", { leagueId });
  return events;
}

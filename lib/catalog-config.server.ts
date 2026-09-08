/** Server-only catalog API configuration (BetPlus backend). */

const DEFAULT_FEATURED_LEAGUES = "92,15,18,241,353,348,191,103";

export function getCatalogApiConfig() {
  const baseUrl = (process.env.CATALOG_API_URL ?? "").replace(/\/$/, "");
  const authPath = process.env.CATALOG_API_AUTH_PATH ?? "";

  const featuredRaw =
    process.env.CATALOG_FEATURED_LEAGUE_IDS ?? DEFAULT_FEATURED_LEAGUES;
  const featuredLeagueIds = featuredRaw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  return {
    baseUrl,
    enabled: baseUrl.length > 0,
    apiKey: process.env.CATALOG_API_KEY ?? "",
    /** Empty auth path = public catalog (BetPlus default). */
    requiresAuth: authPath.length > 0,
    authPath,
    sportsPath: process.env.CATALOG_API_SPORTS_PATH ?? "/api/v1/catalog/sports",
    leaguesPath: process.env.CATALOG_API_LEAGUES_PATH ?? "/api/v1/catalog/leagues",
    /** Sports fixtures — backend calls these "games". */
    matchesPath: process.env.CATALOG_API_MATCHES_PATH ?? "/api/v1/catalog/games",
    matchDetailPath:
      process.env.CATALOG_API_MATCH_DETAIL_PATH ?? "/api/v1/catalog/games",
    featuredLeagueIds,
  };
}

export const CATALOG_TOKEN_COOKIE = "betplus_catalog_token";

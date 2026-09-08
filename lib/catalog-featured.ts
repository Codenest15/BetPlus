/** Client-safe featured league ids (mirrors server CATALOG_FEATURED_LEAGUE_IDS). */
const DEFAULT = "92,15,18,241,353,348,191,103";

export function getFeaturedLeagueIds(): number[] {
  const raw =
    process.env.NEXT_PUBLIC_CATALOG_FEATURED_LEAGUE_IDS ??
    process.env.CATALOG_FEATURED_LEAGUE_IDS ??
    DEFAULT;

  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
}

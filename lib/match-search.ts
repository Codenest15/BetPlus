import type { Match } from "./types";
import { formatMatchDisplayId } from "./utils";

export function filterMatchesBySearch(matches: Match[], query: string): Match[] {
  const q = query.trim().toLowerCase();
  if (!q) return matches;

  return matches.filter((match) => {
    const displayId = formatMatchDisplayId(match).toLowerCase();
    const catalogId = match.catalogId != null ? String(match.catalogId) : "";

    return (
      match.homeTeam.toLowerCase().includes(q) ||
      match.awayTeam.toLowerCase().includes(q) ||
      match.homeAbbr.toLowerCase().includes(q) ||
      match.awayAbbr.toLowerCase().includes(q) ||
      match.league.toLowerCase().includes(q) ||
      match.id.toLowerCase().includes(q) ||
      displayId.includes(q) ||
      catalogId.includes(q) ||
      `${match.homeTeam} ${match.awayTeam}`.toLowerCase().includes(q) ||
      `${match.homeTeam} vs ${match.awayTeam}`.toLowerCase().includes(q)
    );
  });
}

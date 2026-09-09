import { MATCHES } from "./mock-data";
import type { Match, Sport } from "./types";

const OTHER_SPORTS: Sport[] = ["basketball", "baseball", "hockey"];

/** Add demo fixtures for sports missing from the catalog API (NBA, MLB, NHL). */
export function mergeHomeSportEvents(catalogEvents: Match[]): Match[] {
  const byId = new Map<string, Match>();
  for (const event of catalogEvents) {
    byId.set(event.id, event);
  }

  const sportsPresent = new Set(catalogEvents.map((event) => event.sport));
  for (const sport of OTHER_SPORTS) {
    if (sportsPresent.has(sport)) continue;
    for (const event of MATCHES.filter((match) => match.sport === sport)) {
      byId.set(event.id, event);
    }
  }

  return [...byId.values()];
}

export function leaguesVisibleForSport(sport: Sport | "all") {
  return sport === "all" || sport === "football";
}

export function featuredVisibleForSport(sport: Sport | "all", searching: boolean) {
  return !searching && (sport === "all" || sport === "football");
}

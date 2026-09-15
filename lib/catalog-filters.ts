import type { Match, Sport } from "./types";
import { isMatchLive, isMatchUpcoming } from "./match-status";

/** How many days ahead the "All" tab shows when no league is selected. */
export const CATALOG_ALL_WINDOW_DAYS = 7;

export type CatalogViewFilter = {
  sport?: Sport;
  leagueId?: number | null;
};

type CatalogFilterInput = Sport | CatalogViewFilter | undefined;

function resolveFilter(input: CatalogFilterInput): CatalogViewFilter {
  if (!input) return {};
  if (typeof input === "string") return { sport: input };
  return input;
}

function applyFilter(events: Match[], filter: CatalogViewFilter) {
  let list = events;
  if (filter.sport) {
    list = list.filter((event) => event.sport === filter.sport);
  }
  if (filter.leagueId) {
    list = list.filter((event) => event.leagueId === filter.leagueId);
  }
  return list;
}

function sortByKickoff(events: Match[]) {
  return [...events].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
  );
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfAllWindow(now = new Date()) {
  const end = startOfDay(now);
  end.setDate(end.getDate() + CATALOG_ALL_WINDOW_DAYS + 1);
  return end;
}

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Upcoming kickoffs from today through the next week (no live, no finished). */
function inAllWindow(event: Match, now = new Date()) {
  if (!isMatchUpcoming(event, now)) return false;
  const kickoff = new Date(event.kickoff);
  return kickoff >= startOfDay(now) && kickoff < endOfAllWindow(now);
}

/** League filter on All — upcoming only, from today onward. */
function inLeagueSchedule(event: Match, now = new Date()) {
  if (!isMatchUpcoming(event, now)) return false;
  return new Date(event.kickoff) >= startOfDay(now);
}

/** Scheduled fixtures only — like SportyBet `time=all` (no live mixed in). */
export function getAllFromCatalog(events: Match[], filter?: CatalogFilterInput) {
  const resolved = resolveFilter(filter);
  const base = applyFilter(events, resolved);

  const list = resolved.leagueId
    ? base.filter((event) => inLeagueSchedule(event))
    : base.filter((event) => inAllWindow(event));

  return sortByKickoff(list);
}

/** In-play only — started matches that have not finished. */
export function getLiveFromCatalog(events: Match[], filter?: CatalogFilterInput) {
  return sortByKickoff(
    applyFilter(events, resolveFilter(filter)).filter((event) =>
      isMatchLive(event),
    ),
  );
}

/** Today's upcoming kickoffs — not live, not finished. */
export function getTodayFromCatalog(events: Match[], filter?: CatalogFilterInput) {
  const now = new Date();
  return sortByKickoff(
    applyFilter(events, resolveFilter(filter)).filter((event) => {
      if (!isMatchUpcoming(event, now)) return false;
      return isSameCalendarDay(new Date(event.kickoff), now);
    }),
  );
}

/** Upcoming (not live, not finished). */
export function getUpcomingFromCatalog(events: Match[], filter?: CatalogFilterInput) {
  const now = new Date();
  return sortByKickoff(
    applyFilter(events, resolveFilter(filter)).filter((event) =>
      isMatchUpcoming(event, now),
    ),
  );
}

export function getGameCategoriesFromCatalog(
  categories: Iterable<string>,
) {
  const set = new Set<string>(["All"]);
  for (const category of categories) set.add(category);
  return [...set];
}

export { isMatchLive, isMatchUpcoming, isMatchFinished } from "./match-status";

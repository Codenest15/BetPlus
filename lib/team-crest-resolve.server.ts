/** Server-side team crest lookup (TheSportsDB) with in-memory cache. */

import {
  scoreTeamSearchResult,
  teamCrestSearchCandidates,
} from "./team-crest-names";

const crestCache = new Map<string, string | null>();

function normalizeKey(teamName: string) {
  return teamName.trim().toLowerCase();
}

type SportsDbTeam = {
  strTeam?: string;
  strSport?: string;
  strBadge?: string | null;
  strTeamBadge?: string | null;
};

async function fetchTeamsFromSportsDb(query: string): Promise<SportsDbTeam[]> {
  const res = await fetch(
    `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(query)}`,
    { next: { revalidate: 60 * 60 * 24 * 7 } },
  );
  if (!res.ok) return [];

  const data = (await res.json()) as { teams?: SportsDbTeam[] | null };
  return Array.isArray(data.teams) ? data.teams : [];
}

function pickBestTeam(originalName: string, teams: SportsDbTeam[]): SportsDbTeam | null {
  if (teams.length === 0) return null;

  let best: SportsDbTeam | null = null;
  let bestScore = -Infinity;

  for (const team of teams) {
    const score = scoreTeamSearchResult(originalName, team);
    if (score > bestScore) {
      bestScore = score;
      best = team;
    }
  }

  return bestScore > 0 ? best : teams[0] ?? null;
}

async function fetchBadgeFromSportsDb(teamName: string): Promise<string | null> {
  const candidates = teamCrestSearchCandidates(teamName);

  for (const query of candidates) {
    const teams = await fetchTeamsFromSportsDb(query);
    const best = pickBestTeam(teamName, teams);
    const badge = best?.strBadge ?? best?.strTeamBadge ?? null;
    if (badge) return badge;
  }

  return null;
}

export async function resolveTeamCrestUrl(teamName: string): Promise<string | null> {
  const trimmed = teamName.trim();
  if (!trimmed) return null;

  const key = normalizeKey(trimmed);
  if (crestCache.has(key)) return crestCache.get(key) ?? null;

  const badge = await fetchBadgeFromSportsDb(trimmed);
  crestCache.set(key, badge);
  return badge;
}

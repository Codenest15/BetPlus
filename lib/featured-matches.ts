import type { CatalogLeague } from "./catalog-types";
import type { Match } from "./types";

export interface FeaturedLeagueTab {
  id: string;
  label: string;
  shortLabel: string;
  test: (match: Match) => boolean;
}

const HOT_LEAGUE_TABS: Omit<FeaturedLeagueTab, "test">[] = [
  { id: "all", label: "All Hot", shortLabel: "All" },
  { id: "ucl", label: "UEFA Champions League", shortLabel: "UCL" },
  { id: "uel", label: "UEFA Europa League", shortLabel: "Europa" },
  { id: "epl", label: "Premier League", shortLabel: "EPL" },
  { id: "laliga", label: "La Liga", shortLabel: "La Liga" },
  { id: "seriea", label: "Serie A", shortLabel: "Serie A" },
  { id: "bundesliga", label: "Bundesliga", shortLabel: "Bundesliga" },
  { id: "ligue1", label: "Ligue 1", shortLabel: "Ligue 1" },
  { id: "brasileiro", label: "Brasileiro Serie A", shortLabel: "Brasileirão" },
];

const LEAGUE_MATCHERS: Record<string, RegExp> = {
  ucl: /champions league/i,
  uel: /europa league/i,
  epl: /^premier league(\s+srl)?$/i,
  laliga: /^la\s*liga(\s+srl)?$/i,
  seriea: /^serie a(\s+srl)?$/i,
  bundesliga: /^bundesliga(\s+srl)?$/i,
  ligue1: /^ligue 1(\s+srl)?$/i,
  brasileiro: /brasileiro|brazilian serie a|brasil(eiro)?\s+serie\s+a/i,
};

const BIG_TEAMS = new Set(
  [
    "Arsenal",
    "Chelsea",
    "Liverpool",
    "Manchester City",
    "Manchester United",
    "Tottenham",
    "Newcastle",
    "Aston Villa",
    "West Ham",
    "Real Madrid",
    "Barcelona",
    "Atletico Madrid",
    "Sevilla",
    "Bayern Munich",
    "Borussia Dortmund",
    "RB Leipzig",
    "Inter Milan",
    "AC Milan",
    "Juventus",
    "Napoli",
    "Roma",
    "Paris Saint-Germain",
    "PSG",
    "Marseille",
    "Lyon",
    "Benfica",
    "Porto",
    "Sporting CP",
    "Ajax",
    "PSV",
    "Feyenoord",
    "Celtic",
    "Rangers",
    "Galatasaray",
    "Fenerbahce",
    "Besiktas",
  ].map((name) => name.toLowerCase()),
);

function normalizeTeam(name: string) {
  return name.trim().toLowerCase();
}

export function isBigTeam(teamName: string) {
  const key = normalizeTeam(teamName);
  if (BIG_TEAMS.has(key)) return true;
  for (const big of BIG_TEAMS) {
    if (key.includes(big) || big.includes(key)) return true;
  }
  return false;
}

export function isHotLeague(league: string) {
  return Object.values(LEAGUE_MATCHERS).some((pattern) => pattern.test(league));
}

function matchLeagueTab(match: Match, tabId: string) {
  if (tabId === "all") return true;
  const pattern = LEAGUE_MATCHERS[tabId];
  return pattern ? pattern.test(match.league) : false;
}

export function isFeaturedMatch(match: Match) {
  if (match.sport !== "football") return false;
  if (match.isLive) return isHotLeague(match.league) || isBigTeam(match.homeTeam) || isBigTeam(match.awayTeam);
  const kickoff = new Date(match.kickoff).getTime();
  if (Number.isNaN(kickoff) || kickoff < Date.now() - 15 * 60 * 1000) return false;
  return isHotLeague(match.league) || isBigTeam(match.homeTeam) || isBigTeam(match.awayTeam);
}

export function isHotFeaturedMatch(match: Match) {
  const bothBig = isBigTeam(match.homeTeam) && isBigTeam(match.awayTeam);
  return bothBig || /champions league|europa league/i.test(match.league);
}

function featuredMatchScore(match: Match) {
  let score = 0;
  if (match.isLive) score += 1000;
  if (/champions league/i.test(match.league)) score += 200;
  if (/europa league/i.test(match.league)) score += 150;
  if (/^premier league$|^la liga$|^serie a$|^bundesliga$|^ligue 1$/i.test(match.league)) {
    score += 120;
  }
  if (isBigTeam(match.homeTeam)) score += 40;
  if (isBigTeam(match.awayTeam)) score += 40;
  if (isBigTeam(match.homeTeam) && isBigTeam(match.awayTeam)) score += 80;
  return score;
}

export function getFeaturedLeagueTabs(
  events: Match[],
  catalogLeagues: CatalogLeague[] = [],
): FeaturedLeagueTab[] {
  const featured = events.filter(isFeaturedMatch);
  const tabs: FeaturedLeagueTab[] = HOT_LEAGUE_TABS.map(
    (tab): FeaturedLeagueTab => ({
      ...tab,
      test: (match: Match) => matchLeagueTab(match, tab.id),
    }),
  ).filter((tab) => {
    if (tab.id === "all") return featured.length > 0;
    return featured.some((match) => tab.test(match));
  });

  if (catalogLeagues.length > 0) {
    for (const league of catalogLeagues) {
      const exists = tabs.some((tab) => tab.label === league.name);
      if (exists) continue;
      if (!featured.some((m) => m.leagueId === league.id)) continue;
      tabs.push({
        id: `league-${league.id}`,
        label: league.name,
        shortLabel: league.name.length > 14 ? league.name.slice(0, 12) + "…" : league.name,
        test: (match) => match.leagueId === league.id,
      });
    }
  }

  return tabs;
}

export function getFeaturedMatches(
  events: Match[],
  tabId: string,
  limit = 12,
): Match[] {
  return events
    .filter(isFeaturedMatch)
    .filter((match) => {
      if (tabId === "all") return true;
      if (tabId.startsWith("league-")) {
        const leagueId = Number(tabId.replace("league-", ""));
        return match.leagueId === leagueId;
      }
      return matchLeagueTab(match, tabId);
    })
    .sort((a, b) => {
      const scoreDiff = featuredMatchScore(b) - featuredMatchScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
    })
    .slice(0, limit);
}

export function formatFeaturedKickoffLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const matchDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (matchDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function featuredMarketCount(match: Match) {
  if (match.catalogMarkets?.length) return match.catalogMarkets.length;
  return null;
}

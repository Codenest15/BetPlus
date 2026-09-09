import { GAMES } from "./games-data";
import type { Game } from "./games-data";
import { formatKickoff } from "./utils";
import { MATCHES, SPORTS } from "./mock-data";
import {
  countryDisplayName,
  countrySlugFromLeague,
} from "./catalog-country";
import { isSport } from "./catalog-types";
import type {
  CatalogLeague,
  CatalogSport,
  RemoteCatalogGame,
  RemoteGame,
  RemoteSport,
} from "./catalog-types";
import type { BettingMarket, MarketCategory, MarketOutcome, Match, Sport } from "./types";

function abbr(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function normalizeSportId(raw: string | undefined): Sport {
  const value = (raw ?? "football").toLowerCase();
  if (isSport(value)) return value;
  if (value.includes("football") || value.includes("soccer")) return "football";
  if (value.includes("basket")) return "basketball";
  if (value.includes("baseball")) return "baseball";
  if (value.includes("hockey")) return "hockey";
  return "football";
}

function isMarketCategory(value: string): value is MarketCategory {
  return [
    "favourites",
    "all",
    "main",
    "goals",
    "half",
    "bookings",
    "corners",
    "combo",
    "players",
    "teams",
    "minutes",
    "match",
    "to-qualify",
  ].includes(value);
}

export function normalizeCatalogMarkets(raw: unknown): BettingMarket[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;

  const markets: BettingMarket[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as NonNullable<RemoteCatalogGame["markets"]>[number];
    const outcomes: MarketOutcome[] = Array.isArray(row.outcomes)
      ? row.outcomes
          .filter((o) => o && typeof o.odds === "number")
          .map((o) => {
            const outcome: MarketOutcome = {
              id: String(o.id ?? o.label ?? "outcome"),
              label: String(o.label ?? ""),
              odds: Number(o.odds),
            };
            if (o.team === "home" || o.team === "away") {
              outcome.team = o.team;
            }
            return outcome;
          })
      : [];
    if (outcomes.length === 0) continue;

    const categoryRaw = String(row.category ?? "main");
    markets.push({
      id: String(row.id ?? row.name ?? `market-${markets.length}`),
      name: String(row.name ?? "Market"),
      category: isMarketCategory(categoryRaw) ? categoryRaw : "main",
      outcomes,
    });
  }

  return markets.length > 0 ? markets : undefined;
}

export function mockCatalogSports(): CatalogSport[] {
  return SPORTS.map((sport) => ({ id: sport.id, label: sport.label }));
}

export function mockCatalogEvents(): Match[] {
  return MATCHES;
}

export function mockCatalogGames(): Game[] {
  return GAMES;
}

/** Map BetPlus sports fixtures to game cards (live / upcoming). */
export function matchesToGameCards(matches: Match[]): Game[] {
  return matches.map((match) => ({
    id: match.id,
    title: `${match.homeTeam} vs ${match.awayTeam}`,
    category: match.isLive ? "Live" : match.league,
    players: match.isLive
      ? `Live ${match.liveMinute ?? 0}' · ${match.homeScore ?? 0}-${match.awayScore ?? 0}`
      : formatKickoff(match.kickoff),
    gradient: match.isLive ? "from-red-600 to-orange-600" : "from-brand to-brand-dark",
    icon: "virtual-football",
    featured: match.isLive,
    href: `/match/${encodeURIComponent(match.id)}`,
  }));
}

type RemoteLeague = {
  id?: number;
  sport_id?: number;
  name?: string;
  slug?: string;
};

export function normalizeLeagues(raw: unknown, sportId?: number): CatalogLeague[] {
  if (!raw) return [];

  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { leagues?: RemoteLeague[] }).leagues)
      ? (raw as { leagues: RemoteLeague[] }).leagues
      : [];

  return list
    .filter((item) => typeof item.id === "number" && item.name)
    .filter((item) => (sportId ? item.sport_id === sportId : true))
    .map((item) => {
      const name = String(item.name);
      const slug = String(item.slug ?? name);
      const countrySlug = countrySlugFromLeague(slug, name);
      return {
        id: item.id!,
        sportId: item.sport_id ?? sportId ?? 0,
        name,
        slug,
        countrySlug,
        countryName: countryDisplayName(countrySlug),
      };
    });
}

export function normalizeSports(raw: unknown): CatalogSport[] {
  if (!raw) return mockCatalogSports();

  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { sports?: RemoteSport[] }).sports)
      ? (raw as { sports: RemoteSport[] }).sports
      : Array.isArray((raw as { data?: RemoteSport[] }).data)
        ? (raw as { data: RemoteSport[] }).data
        : [];

  if (list.length === 0) return mockCatalogSports();

  return list.map((item, index) => {
    const slug = item.slug ? String(item.slug) : undefined;
    const id = slug ?? String(item.id ?? `sport-${index}`);
    const label = String(item.label ?? item.name ?? id);
    return { id, label, slug };
  });
}

export function normalizeCatalogGame(item: RemoteCatalogGame, index = 0): Match {
  const homeTeam = String(item.home ?? "Home");
  const awayTeam = String(item.away ?? "Away");
  const sport = normalizeSportId(item.sport ?? undefined);
  const drawOdds = item.odds_draw ?? 0;
  const statusRaw = item.status ? String(item.status) : undefined;
  const statusLower = (statusRaw ?? "").toLowerCase();
  const finished = [
    "finished",
    "ended",
    "ft",
    "fulltime",
    "complete",
    "closed",
    "cancelled",
    "canceled",
  ].some((part) => statusLower.includes(part));
  const isLive =
    !finished &&
    (item.is_live === true ||
      statusLower === "live" ||
      statusLower === "inplay" ||
      statusLower === "in_play");

  return {
    id: String(item.external_id ?? item.id ?? `evt-${index}`),
    catalogId: typeof item.id === "number" ? item.id : undefined,
    sport,
    leagueId: typeof item.league_id === "number" ? item.league_id : undefined,
    league: String(item.league_name ?? "League"),
    homeTeam,
    awayTeam,
    homeAbbr: item.home_abbr ?? abbr(homeTeam),
    awayAbbr: item.away_abbr ?? abbr(awayTeam),
    homeLogoUrl: item.home_logo ?? null,
    awayLogoUrl: item.away_logo ?? null,
    kickoff: String(item.starts_at ?? new Date().toISOString()),
    status: statusRaw,
    isLive,
    liveMinute: item.live_minute ?? undefined,
    homeScore: item.home_score ?? undefined,
    awayScore: item.away_score ?? undefined,
    odds: {
      home: Number(item.odds_home ?? 1.9),
      draw: Number(drawOdds),
      away: Number(item.odds_away ?? 1.9),
    },
    catalogMarkets: normalizeCatalogMarkets(item.markets),
  };
}

export function normalizeEvents(raw: unknown): Match[] {
  if (!raw) return mockCatalogEvents();

  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { events?: RemoteCatalogGame[] }).events)
      ? (raw as { events: RemoteCatalogGame[] }).events
      : Array.isArray((raw as { data?: RemoteCatalogGame[] }).data)
        ? (raw as { data: RemoteCatalogGame[] }).data
        : [];

  if (list.length === 0) return mockCatalogEvents();

  return list.map((item, index) =>
    normalizeCatalogGame(item as RemoteCatalogGame, index),
  );
}

export function normalizeGames(raw: unknown): Game[] {
  if (!raw) return mockCatalogGames();

  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { games?: RemoteGame[] }).games)
      ? (raw as { games: RemoteGame[] }).games
      : Array.isArray((raw as { data?: RemoteGame[] }).data)
        ? (raw as { data: RemoteGame[] }).data
        : [];

  if (list.length === 0) return mockCatalogGames();

  return list.map((item, index) => {
    const title = String(item.title ?? item.name ?? `Game ${index + 1}`);
    const category = String(item.category ?? "All");
    return {
      id: String(item.id ?? `game-${index}`),
      title,
      category,
      players: String(item.players ?? "—"),
      gradient: String(item.gradient ?? "from-brand to-brand-dark"),
      icon: (item.icon as Game["icon"]) ?? "spin2win",
      featured: item.featured === true,
    };
  });
}

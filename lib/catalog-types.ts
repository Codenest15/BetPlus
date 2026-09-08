import type { BettingMarket, Match, Sport } from "./types";

export interface CatalogSport {
  id: string;
  label: string;
  slug?: string;
}

export interface CatalogLeague {
  id: number;
  sportId: number;
  name: string;
  slug: string;
  countrySlug: string;
  countryName: string;
}

export interface CatalogPipelineStep {
  step: "auth" | "sports" | "events";
  ok: boolean;
  ms: number;
  error?: string;
}

export interface CatalogPayload {
  source: "api" | "mock";
  sports: CatalogSport[];
  leagues: CatalogLeague[];
  events: Match[];
  steps: CatalogPipelineStep[];
}

export type RemoteSport = {
  id?: number | string;
  name?: string;
  label?: string;
  slug?: string;
};

/** BetPlus `GameOut` — a sports fixture with odds and markets. */
export type RemoteCatalogGame = {
  id?: number;
  external_id?: string;
  league_id?: number;
  league_name?: string | null;
  sport?: string | null;
  home?: string;
  away?: string;
  home_abbr?: string | null;
  away_abbr?: string | null;
  starts_at?: string | null;
  status?: string;
  is_live?: boolean;
  live_minute?: number | null;
  home_score?: number | null;
  away_score?: number | null;
  odds_home?: number | null;
  odds_draw?: number | null;
  odds_away?: number | null;
  markets?: Array<{
    id?: string;
    name?: string;
    category?: string;
    outcomes?: Array<{
      id?: string;
      label?: string;
      odds?: number;
      team?: string;
    }>;
  }>;
};

export type RemoteGame = {
  id?: string;
  title?: string;
  name?: string;
  category?: string;
  players?: string;
  gradient?: string;
  icon?: string;
  featured?: boolean;
};

export function isSport(value: string): value is Sport {
  return (
    value === "football" ||
    value === "basketball" ||
    value === "baseball" ||
    value === "hockey"
  );
}

export type MatchWithCatalogMarkets = Match & {
  catalogMarkets?: BettingMarket[];
};

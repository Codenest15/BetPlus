import type { BettingMarket, MarketOutcome, Match } from "./types";
import { isMatchLive } from "./match-status";
import { r } from "./market-factories";
import {
  getLiveMatchOdds,
  isLive1x2StyleMarket,
  liveDnbOdds,
  liveDoubleChanceOdds,
  matchOutcomeSide,
} from "./live-odds";

type OuSide = "over" | "under";

interface LiveCtx {
  home: number;
  away: number;
  total: number;
  minute: number;
}

export interface LiveMarketStateOptions {
  /** Brief freeze after a goal/incident — greys out open selections (SportyBet-style). */
  oddsFrozen?: boolean;
}

function liveCtx(match: Match): LiveCtx {
  return {
    home: match.homeScore ?? 0,
    away: match.awayScore ?? 0,
    total: (match.homeScore ?? 0) + (match.awayScore ?? 0),
    minute: match.liveMinute ?? 0,
  };
}

function parseOu(label: string): { side: OuSide; line: number } | null {
  const over = label.match(/^Over\s+([\d.]+)$/i);
  if (over) return { side: "over", line: Number(over[1]) };
  const under = label.match(/^Under\s+([\d.]+)$/i);
  if (under) return { side: "under", line: Number(under[1]) };
  return null;
}

function ouSettled(side: OuSide, line: number, goals: number): boolean {
  if (side === "over") return goals > line;
  return goals > line;
}

function scopeGoals(market: BettingMarket, match: Match, ctx: LiveCtx): number {
  const name = market.name.toLowerCase();
  const id = market.id.toLowerCase();

  if (id.includes("team-ou-h") || name.includes(match.homeTeam.toLowerCase())) {
    return ctx.home;
  }
  if (id.includes("team-ou-a") || name.includes(match.awayTeam.toLowerCase())) {
    return ctx.away;
  }
  return ctx.total;
}

function isFirstHalfMarket(market: BettingMarket) {
  const text = `${market.id} ${market.name}`.toLowerCase();
  return (
    text.includes("1st half") ||
    text.includes("first half") ||
    /^1h-/.test(market.id) ||
    market.id.startsWith("half1-")
  );
}

function isSecondHalfMarket(market: BettingMarket) {
  const text = `${market.id} ${market.name}`.toLowerCase();
  return text.includes("2nd half") || text.includes("second half") || /^2h-/.test(market.id);
}

function isEarlyGoalsMarket(market: BettingMarket) {
  return market.name.toLowerCase().includes("early goals");
}

function minuteWindowEnd(market: BettingMarket): number | null {
  const fromName = market.name.match(/from 1 to (\d+) minute/i);
  if (fromName) return Number(fromName[1]);
  const fromId = market.id.match(/^m(?:1x2|ou)-(\d+)/i);
  if (fromId) return Number(fromId[1]);
  return null;
}

function isPeriodClosed(market: BettingMarket, minute: number): boolean {
  if (isEarlyGoalsMarket(market)) return minute > 15;
  const windowEnd = minuteWindowEnd(market);
  if (windowEnd != null && minute > windowEnd) return true;
  if (isFirstHalfMarket(market) && minute > 45) return true;
  if (isSecondHalfMarket(market) && minute < 46) return true;
  return false;
}

function parseCorrectScore(label: string): { home: number; away: number } | null {
  const m = label.match(/^(\d+)\s*[:\-]\s*(\d+)$/);
  if (!m) return null;
  return { home: Number(m[1]), away: Number(m[2]) };
}

function correctScoreSettled(
  pick: { home: number; away: number },
  ctx: LiveCtx,
): boolean {
  if (ctx.home === pick.home && ctx.away === pick.away) return true;
  if (ctx.home > pick.home || ctx.away > pick.away) return true;
  return false;
}

function yesNoSettled(label: string, market: BettingMarket, ctx: LiveCtx): boolean {
  const text = `${market.name} ${market.id}`.toLowerCase();
  const isBtts =
    text.includes("both teams") ||
    text.includes("gg/ng") ||
    text.includes("btts") ||
    market.id.includes("btts") ||
    market.id.includes("gg");

  if (!isBtts) return false;
  if (ctx.home <= 0 || ctx.away <= 0) return false;
  return label.toLowerCase() === "yes" || label.toLowerCase() === "no";
}

function liveOverOdds(line: number, goals: number, minute: number, base: number) {
  const target = Math.floor(line) + 1;
  const needed = Math.max(0, target - goals);
  if (needed === 0) return base;
  const minutesLeft = Math.max(1, 90 - minute);
  const pressure = needed / (minutesLeft / 25);
  return r(Math.min(19, base * (1 + pressure * 0.35)));
}

function liveUnderOdds(line: number, goals: number, minute: number, base: number) {
  const maxGoals = Math.floor(line);
  const room = maxGoals - goals;
  if (room < 0) return base;
  const minutesLeft = Math.max(1, 90 - minute);
  const drift = (90 - minutesLeft) / 90;
  const tighten = room === 0 ? 0.55 : room === 1 ? 0.75 : 1;
  return r(Math.max(1.01, base * tighten * (1 - drift * 0.25)));
}

function applyLiveOdds(
  outcome: MarketOutcome,
  market: BettingMarket,
  match: Match,
  ctx: LiveCtx,
): MarketOutcome {
  const ou = parseOu(outcome.label);
  if (!ou) return outcome;

  const goals = scopeGoals(market, match, ctx);
  if (ou.side === "over") {
    return { ...outcome, odds: liveOverOdds(ou.line, goals, ctx.minute, outcome.odds) };
  }
  return { ...outcome, odds: liveUnderOdds(ou.line, goals, ctx.minute, outcome.odds) };
}

/** Hide played/settled outcomes; keep only open lines (SportyBet removes them). */
function evaluateOutcome(
  outcome: MarketOutcome,
  market: BettingMarket,
  match: Match,
  ctx: LiveCtx,
): MarketOutcome | null {
  if (isPeriodClosed(market, ctx.minute)) return null;

  const ou = parseOu(outcome.label);
  if (ou) {
    const goals = scopeGoals(market, match, ctx);
    if (ouSettled(ou.side, ou.line, goals)) return null;
    return applyLiveOdds(outcome, market, match, ctx);
  }

  const cs = parseCorrectScore(outcome.label);
  if (cs && correctScoreSettled(cs, ctx)) return null;

  if (yesNoSettled(outcome.label, market, ctx)) return null;

  if (
    (market.id === "first-goal" ||
      market.name.toLowerCase().includes("1st goal") ||
      market.name.toLowerCase().includes("first goal")) &&
    outcome.label.toLowerCase() === "none" &&
    ctx.total > 0
  ) {
    return null;
  }

  return outcome;
}

function applyLiveMainMarketOdds(
  market: BettingMarket,
  match: Match,
): BettingMarket {
  const live = getLiveMatchOdds(match);

  if (market.id === "double-chance") {
    const dc = liveDoubleChanceOdds(live);
    return {
      ...market,
      outcomes: market.outcomes.map((outcome) => {
        const label = outcome.label.toLowerCase();
        if (label.includes("home") && label.includes("draw")) {
          return { ...outcome, odds: dc.hd };
        }
        if (label.includes("home") && label.includes("away")) {
          return { ...outcome, odds: dc.ha };
        }
        if (label.includes("draw") && label.includes("away")) {
          return { ...outcome, odds: dc.da };
        }
        return outcome;
      }),
    };
  }

  if (market.id === "dnb") {
    const dnb = liveDnbOdds(live);
    return {
      ...market,
      outcomes: market.outcomes.map((outcome) => {
        const side = matchOutcomeSide(outcome.label, match);
        if (side === "home") return { ...outcome, odds: dnb.home };
        if (side === "away") return { ...outcome, odds: dnb.away };
        return outcome;
      }),
    };
  }

  if (!isLive1x2StyleMarket(market.id)) return market;

  return {
    ...market,
    outcomes: market.outcomes.map((outcome) => {
      const side = matchOutcomeSide(outcome.label, match);
      if (!side) return outcome;
      return { ...outcome, odds: live[side] };
    }),
  };
}

function evaluateMarket(
  market: BettingMarket,
  match: Match,
  ctx: LiveCtx,
): BettingMarket | null {
  const outcomes = market.outcomes
    .map((outcome) => evaluateOutcome(outcome, market, match, ctx))
    .filter((outcome): outcome is MarketOutcome => outcome != null);

  if (outcomes.length === 0) return null;
  return applyLiveMainMarketOdds({ ...market, outcomes }, match);
}

/** Grey out open odds briefly after a goal/incident while prices refresh. */
export function applyLiveOddsFreeze(markets: BettingMarket[]): BettingMarket[] {
  return markets.map((market) => ({
    ...market,
    outcomes: market.outcomes.map((outcome) => ({ ...outcome, suspended: true })),
  }));
}

/** Hide settled live lines and refresh open in-play odds. */
export function applyLiveMarketState(
  match: Match,
  markets: BettingMarket[],
  options: LiveMarketStateOptions = {},
): BettingMarket[] {
  if (!isMatchLive(match)) return markets;

  const ctx = liveCtx(match);
  const visible = markets
    .map((market) => evaluateMarket(market, match, ctx))
    .filter((market): market is BettingMarket => market != null);

  if (options.oddsFrozen) {
    return applyLiveOddsFreeze(visible);
  }

  return visible;
}

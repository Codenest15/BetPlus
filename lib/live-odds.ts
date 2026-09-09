import { r } from "./market-factories";
import { isMatchLive } from "./match-status";
import type { Match, OddsSelection } from "./types";

export type MatchOdds = Match["odds"];

/** Catalog/API rows already carry in-play 1X2 refreshed on each poll. */
function useApiLiveOdds(match: Match): boolean {
  return match.catalogId != null;
}

/**
 * Estimate in-play 1X2 from score + clock when the feed has no live prices (mock/dev).
 * Winning side odds drop; level late → draw shortens; trailing side drifts out.
 */
export function computeLive1x2Odds(match: Match): MatchOdds {
  const pre = match.odds;
  const h = match.homeScore ?? 0;
  const a = match.awayScore ?? 0;
  const minute = Math.min(90, Math.max(0, match.liveMinute ?? 0));
  const minutesLeft = Math.max(1, 90 - minute);
  const progress = 1 - minutesLeft / 90;

  let ph = 1 / pre.home;
  let pd = 1 / pre.draw;
  let pa = 1 / pre.away;
  const sum = ph + pd + pa;
  ph /= sum;
  pd /= sum;
  pa /= sum;

  const diff = h - a;
  const boost = progress * 0.38;

  if (diff > 0) {
    ph = Math.min(0.94, ph + boost * Math.min(diff, 3) * 0.18);
    pa = Math.max(0.015, pa - boost * Math.min(diff, 3) * 0.14);
    pd = Math.max(0.015, pd - boost * 0.1);
  } else if (diff < 0) {
    pa = Math.min(0.94, pa + boost * Math.min(-diff, 3) * 0.18);
    ph = Math.max(0.015, ph - boost * Math.min(-diff, 3) * 0.14);
    pd = Math.max(0.015, pd - boost * 0.1);
  } else {
    pd = Math.min(0.82, pd + boost * 0.28);
    ph = Math.max(0.04, ph - boost * 0.14);
    pa = Math.max(0.04, pa - boost * 0.14);
  }

  const renorm = ph + pd + pa;
  ph /= renorm;
  pd /= renorm;
  pa /= renorm;

  const margin = 1.08;
  return {
    home: r(Math.max(1.01, Math.min(50, margin / ph))),
    draw: r(Math.max(1.01, Math.min(50, margin / pd))),
    away: r(Math.max(1.01, Math.min(50, margin / pa))),
  };
}

/** Live 1X2 for display and bet placement — API feed first, computed fallback for mock. */
export function getLiveMatchOdds(match: Match): MatchOdds {
  if (!isMatchLive(match)) return match.odds;
  if (useApiLiveOdds(match)) return match.odds;
  return computeLive1x2Odds(match);
}

export function withLiveMatchOdds(match: Match): Match {
  if (!isMatchLive(match)) return match;
  return { ...match, odds: getLiveMatchOdds(match) };
}

export function matchOutcomeSide(
  label: string,
  match: Match,
): OddsSelection | null {
  if (label === "Draw") return "draw";
  if (label === match.homeTeam) return "home";
  if (label === match.awayTeam) return "away";
  return null;
}

export function liveDoubleChanceOdds(live: MatchOdds): {
  hd: number;
  ha: number;
  da: number;
} {
  const ph = 1 / live.home;
  const pd = 1 / live.draw;
  const pa = 1 / live.away;
  const sum = ph + pd + pa;
  const margin = 1.07;
  return {
    hd: r(margin / ((ph + pd) / sum)),
    ha: r(margin / ((ph + pa) / sum)),
    da: r(margin / ((pd + pa) / sum)),
  };
}

export function liveDnbOdds(live: MatchOdds): { home: number; away: number } {
  const ph = 1 / live.home;
  const pd = 1 / live.draw;
  const pa = 1 / live.away;
  const sum = ph + pd + pa;
  const pHome = ph / sum;
  const pAway = pa / sum;
  const margin = 1.05;
  const nb = pHome + pAway;
  return {
    home: r(margin / (pHome / nb)),
    away: r(margin / (pAway / nb)),
  };
}

const LIVE_1X2_MARKET = /^1x2(-(1up|2up|never-down))?$/;
const LIVE_MINUTE_1X2 = /^m1x2-\d+$/;

export function isLive1x2StyleMarket(marketId: string): boolean {
  return LIVE_1X2_MARKET.test(marketId) || LIVE_MINUTE_1X2.test(marketId);
}

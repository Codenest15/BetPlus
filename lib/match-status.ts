import type { Match } from "./types";

const FINISHED_STATUS_PARTS = [
  "finished",
  "ended",
  "ft",
  "fulltime",
  "complete",
  "closed",
  "cancelled",
  "canceled",
  "postponed",
  "abandoned",
];

function normalizedStatus(match: Match) {
  return (match.status ?? "").toLowerCase();
}

function statusIndicatesFinished(match: Match) {
  const status = normalizedStatus(match);
  return FINISHED_STATUS_PARTS.some((part) => status.includes(part));
}

/** In-play now — started and not finished (SportyBet Live tab). */
export function isMatchLive(match: Match): boolean {
  if (statusIndicatesFinished(match)) return false;
  return match.isLive === true;
}

/** Full time / past kickoff — excluded from Live and All. */
export function isMatchFinished(match: Match, now = new Date()): boolean {
  if (statusIndicatesFinished(match)) return true;
  if (match.isLive === true) return false;
  return new Date(match.kickoff).getTime() < now.getTime();
}

/** Scheduled fixture that has not started yet. */
export function isMatchUpcoming(match: Match, now = new Date()): boolean {
  if (isMatchLive(match)) return false;
  if (isMatchFinished(match, now)) return false;
  return new Date(match.kickoff).getTime() >= now.getTime();
}

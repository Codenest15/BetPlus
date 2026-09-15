"use client";

import { useEffect, useRef, useState } from "react";
import { isMatchLive } from "@/lib/match-status";
import type { Match } from "@/lib/types";

const FREEZE_MS = 3500;

/** SportyBet-style brief odds lock after a goal or live incident. */
export function useLiveOddsFreeze(match: Match) {
  const live = isMatchLive(match);
  const [frozen, setFrozen] = useState(false);
  const prevScore = useRef(`${match.homeScore ?? 0}-${match.awayScore ?? 0}`);

  useEffect(() => {
    if (!live) {
      setFrozen(false);
      return;
    }

    const scoreKey = `${match.homeScore ?? 0}-${match.awayScore ?? 0}`;
    if (scoreKey === prevScore.current) return;

    prevScore.current = scoreKey;
    setFrozen(true);
    const timer = window.setTimeout(() => setFrozen(false), FREEZE_MS);
    return () => window.clearTimeout(timer);
  }, [live, match.homeScore, match.awayScore]);

  return frozen;
}

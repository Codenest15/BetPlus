/** League badge URLs — TheSportsDB CDN (reliable PNG). */

import { normalizeLeagueName } from "./team-crest-names";

const LEAGUE_LOGOS: Record<string, string> = {
  ucl: "https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png",
  uel: "https://r2.thesportsdb.com/images/media/league/badge/mlsr7d1718774547.png",
  epl: "https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png",
  laliga: "https://r2.thesportsdb.com/images/media/league/badge/ja4it51687628717.png",
  seriea: "https://r2.thesportsdb.com/images/media/league/badge/67q3q21679951383.png",
  bundesliga:
    "https://r2.thesportsdb.com/images/media/league/badge/teqh1b1679952008.png",
  ligue1:
    "https://r2.thesportsdb.com/images/media/league/badge/9f7z9d1742983155.png",
  brasileiro:
    "https://r2.thesportsdb.com/images/media/league/badge/lywv7t1766787179.png",
  championship:
    "https://r2.thesportsdb.com/images/media/league/badge/ty5a681688770169.png",
  eredivisie:
    "https://r2.thesportsdb.com/images/media/league/badge/3tgdke1782689102.png",
  mls: "https://r2.thesportsdb.com/images/media/league/badge/dqo6r91549878326.png",
};

const LEAGUE_NAME_PATTERNS: Array<{ pattern: RegExp; key: string }> = [
  { pattern: /champions league/i, key: "ucl" },
  { pattern: /europa league/i, key: "uel" },
  { pattern: /premier league/i, key: "epl" },
  { pattern: /^la\s*liga|^laliga|spanish la liga/i, key: "laliga" },
  { pattern: /^serie a$|italian serie a/i, key: "seriea" },
  { pattern: /^bundesliga$|german bundesliga/i, key: "bundesliga" },
  { pattern: /^ligue 1$|french ligue/i, key: "ligue1" },
  { pattern: /brasileiro|brazilian serie a|brasil(eiro)?\s+serie\s+a/i, key: "brasileiro" },
  { pattern: /^championship$|english championship/i, key: "championship" },
  { pattern: /eredivisie|dutch eredivisie/i, key: "eredivisie" },
  { pattern: /^mls$|major league soccer/i, key: "mls" },
];

export function getLeagueLogoUrl(
  tabId: string,
  leagueName?: string,
): string | null {
  if (tabId !== "all" && LEAGUE_LOGOS[tabId]) {
    return LEAGUE_LOGOS[tabId];
  }

  const normalized = leagueName ? normalizeLeagueName(leagueName) : "";
  if (normalized) {
    for (const { pattern, key } of LEAGUE_NAME_PATTERNS) {
      if (pattern.test(normalized) && LEAGUE_LOGOS[key]) {
        return LEAGUE_LOGOS[key];
      }
    }
  }

  return null;
}

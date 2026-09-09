/** Normalize catalog team names and map common aliases for crest lookup. */

const TEAM_SEARCH_ALIASES: Record<string, string> = {
  psg: "Paris Saint Germain",
  "paris sg": "Paris Saint Germain",
  "paris saint-germain": "Paris Saint Germain",
  "paris saint-germain fc": "Paris Saint Germain",
  "man utd": "Manchester United",
  "man united": "Manchester United",
  "manchester utd": "Manchester United",
  "man city": "Manchester City",
  "man city srl": "Manchester City",
  spurs: "Tottenham Hotspur",
  tottenham: "Tottenham Hotspur",
  inter: "Inter Milan",
  "ac milan": "AC Milan",
  atletico: "Atletico Madrid",
  "atletico madrid": "Atletico Madrid",
  "ath madrid": "Atletico Madrid",
  bayern: "Bayern Munich",
  dortmund: "Borussia Dortmund",
  bvb: "Borussia Dortmund",
  real: "Real Madrid",
  "real madrid": "Real Madrid",
  "real madrid srl": "Real Madrid",
  barca: "Barcelona",
  barcelona: "Barcelona",
  porto: "Porto",
  "porto srl": "Porto",
  "fc porto": "Porto",
  "newcastle utd": "Newcastle United",
  "west ham utd": "West Ham United",
  "nottm forest": "Nottingham Forest",
  nottingham: "Nottingham Forest",
  "sporting": "Sporting CP",
  "sporting lisbon": "Sporting CP",
  "inter milan srl": "Inter Milan",
  "ac milan srl": "AC Milan",
  "barcelona srl": "Barcelona",
  "bayern srl": "Bayern Munich",
  "liverpool srl": "Liverpool",
  "chelsea srl": "Chelsea",
  "arsenal srl": "Arsenal",
};

const PREFIXES =
  /^(CR|FC|SC|AC|AS|SV|RB|CD|SD|CA|SE|EC|AA|GO|PA|VfB|VfL|TSG|1\.|SV\s)\s+/i;
const SUFFIXES =
  /\s+(RS|RJ|FC|SC|CF|AFC|United|City|Utd|Town|County|Wanderers|Hotspur|Albion)$/gi;

/** Strip virtual/simulated league suffixes from catalog names. */
export function stripVirtualSuffixes(name: string) {
  return name
    .replace(/\s+SRL\s*$/i, "")
    .replace(/\s+\(SRL\)\s*$/i, "")
    .replace(/\s+Simulated\s*$/i, "")
    .trim();
}

function pushAliasCandidates(
  out: string[],
  seen: Set<string>,
  value: string,
) {
  const key = value.trim().toLowerCase();
  if (!key || seen.has(key)) return;
  seen.add(key);
  out.push(value.trim());

  const alias = TEAM_SEARCH_ALIASES[key];
  if (alias) pushAliasCandidates(out, seen, alias);
}

export function teamCrestSearchCandidates(teamName: string): string[] {
  const trimmed = teamName.trim();
  if (!trimmed) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  pushAliasCandidates(out, seen, trimmed);

  const noVirtual = stripVirtualSuffixes(trimmed);
  if (noVirtual !== trimmed) pushAliasCandidates(out, seen, noVirtual);

  const noPrefix = trimmed.replace(PREFIXES, "").trim();
  if (noPrefix !== trimmed) pushAliasCandidates(out, seen, noPrefix);

  const noSuffix = trimmed.replace(SUFFIXES, "").replace(/\s+/g, " ").trim();
  if (noSuffix !== trimmed) pushAliasCandidates(out, seen, noSuffix);

  const virtualStripped = stripVirtualSuffixes(
    noPrefix.replace(SUFFIXES, "").replace(/\s+/g, " ").trim(),
  );
  if (virtualStripped) pushAliasCandidates(out, seen, virtualStripped);

  const firstToken = virtualStripped.split(/\s+/)[0] ?? "";
  if (firstToken.length >= 4) pushAliasCandidates(out, seen, firstToken);

  if (/vasco da gama/i.test(trimmed)) pushAliasCandidates(out, seen, "Vasco da Gama");
  if (/paris\s+saint[- ]?germain/i.test(trimmed)) {
    pushAliasCandidates(out, seen, "Paris Saint Germain");
  }

  return out;
}

export function scoreTeamSearchResult(
  teamName: string,
  candidate: {
    strTeam?: string;
    strSport?: string;
    strBadge?: string | null;
    strTeamBadge?: string | null;
  },
): number {
  const target = stripVirtualSuffixes(teamName).toLowerCase();
  const name = candidate.strTeam?.trim().toLowerCase() ?? "";
  if (!name) return -1;

  let score = 0;
  const sport = candidate.strSport?.toLowerCase() ?? "";
  if (sport === "soccer") score += 50;
  if (sport && sport !== "soccer" && sport !== "football") score -= 80;

  if (name === target) score += 100;
  else if (name.includes(target) || target.includes(name)) score += 40;

  const alias = TEAM_SEARCH_ALIASES[target];
  if (alias && name === alias.toLowerCase()) score += 120;

  if (candidate.strBadge || candidate.strTeamBadge) score += 10;

  if (name.includes("talon") || name.includes("esport")) score -= 200;
  if (name.includes("women") && !teamName.toLowerCase().includes("women")) {
    score -= 60;
  }

  return score;
}

/** Normalize league names for logo lookup (strip SRL etc.). */
export function normalizeLeagueName(leagueName: string) {
  return stripVirtualSuffixes(leagueName).trim();
}

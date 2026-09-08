/** Derive BetPlus country slug from league slug + name (SportyBet format). */
export function countrySlugFromLeague(slug: string, leagueName: string): string {
  const base = slug.replace(/-\d+$/, "");
  const leagueSlug = leagueName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (leagueSlug && base.endsWith(leagueSlug)) {
    const country = base.slice(0, base.length - leagueSlug.length).replace(/-$/, "");
    return country || "international";
  }

  return base.split("-")[0] || "international";
}

export function countryDisplayName(countrySlug: string): string {
  return countrySlug
    .replace(/-amateur$/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const FLAG_BY_COUNTRY_SLUG: Record<string, string> = {
  africa: "un",
  albania: "al",
  algeria: "dz",
  andorra: "ad",
  angola: "ao",
  argentina: "ar",
  armenia: "am",
  australia: "au",
  austria: "at",
  azerbaijan: "az",
  bahrain: "bh",
  belarus: "by",
  belgium: "be",
  bolivia: "bo",
  "bosnia-herzegovina": "ba",
  botswana: "bw",
  brazil: "br",
  bulgaria: "bg",
  cambodia: "kh",
  canada: "ca",
  chile: "cl",
  china: "cn",
  colombia: "co",
  "costa-rica": "cr",
  croatia: "hr",
  cyprus: "cy",
  czechia: "cz",
  denmark: "dk",
  "dominican-republic": "do",
  ecuador: "ec",
  egypt: "eg",
  "el-salvador": "sv",
  england: "gb-eng",
  estonia: "ee",
  "faroe-islands": "fo",
  fiji: "fj",
  finland: "fi",
  france: "fr",
  georgia: "ge",
  germany: "de",
  ghana: "gh",
  greece: "gr",
  guatemala: "gt",
  honduras: "hn",
  "hong-kong-china": "hk",
  hungary: "hu",
  iceland: "is",
  india: "in",
  indonesia: "id",
  "international-clubs": "un",
  "international-youth": "un",
  iran: "ir",
  iraq: "iq",
  ireland: "ie",
  israel: "il",
  italy: "it",
  japan: "jp",
  jordan: "jo",
  kazakhstan: "kz",
  kenya: "ke",
  kosovo: "xk",
  kuwait: "kw",
  kyrgyzstan: "kg",
  latvia: "lv",
  lebanon: "lb",
  lithuania: "lt",
  luxembourg: "lu",
  malawi: "mw",
  malaysia: "my",
  malta: "mt",
  mexico: "mx",
  moldova: "md",
  montenegro: "me",
  mozambique: "mz",
  myanmar: "mm",
  netherlands: "nl",
  "new-zealand": "nz",
  nicaragua: "ni",
  niger: "ne",
  nigeria: "ng",
  "north-macedonia": "mk",
  "northern-ireland": "gb-nir",
  norway: "no",
  oman: "om",
  panama: "pa",
  paraguay: "py",
  peru: "pe",
  philippines: "ph",
  poland: "pl",
  portugal: "pt",
  "puerto-rico": "pr",
  qatar: "qa",
  "republic-of-korea": "kr",
  romania: "ro",
  russia: "ru",
  rwanda: "rw",
  "saint-kitts-and-nevis": "kn",
  "san-marino": "sm",
  "saudi-arabia": "sa",
  scotland: "gb-sct",
  serbia: "rs",
  "simulated-reality-league": "un",
  singapore: "sg",
  slovakia: "sk",
  slovenia: "si",
  "solomon-islands": "sb",
  "south-africa": "za",
  spain: "es",
  sweden: "se",
  switzerland: "ch",
  tanzania: "tz",
  thailand: "th",
  tunisia: "tn",
  turkiye: "tr",
  uganda: "ug",
  ukraine: "ua",
  "united-arab-emirates": "ae",
  uruguay: "uy",
  usa: "us",
  uzbekistan: "uz",
  venezuela: "ve",
  vietnam: "vn",
  wales: "gb-wls",
  zanzibar: "tz",
  zimbabwe: "zw",
};

export function countryFlagCode(countrySlug: string): string {
  if (FLAG_BY_COUNTRY_SLUG[countrySlug]) {
    return FLAG_BY_COUNTRY_SLUG[countrySlug];
  }

  const base = countrySlug.replace(/-amateur$/, "");
  if (FLAG_BY_COUNTRY_SLUG[base]) {
    return FLAG_BY_COUNTRY_SLUG[base];
  }

  return "un";
}

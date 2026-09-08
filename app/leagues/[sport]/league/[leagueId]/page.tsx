import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchRow } from "@/components/MatchRow";
import { getCatalogApiConfig } from "@/lib/catalog-config.server";
import { countryDisplayName } from "@/lib/catalog-country";
import {
  catalogLeagueById,
  fetchCatalogLeaguesForSport,
  fetchCatalogMatchesForLeague,
} from "@/lib/leagues-catalog.server";
import {
  getCountryById,
  getLeagueById,
  isValidSport,
  sportLabel,
} from "@/lib/leagues-data";
import { getMatchesForLeague } from "@/lib/leagues-utils";

interface LeagueMatchesPageProps {
  params: Promise<{ sport: string; leagueId: string }>;
}

export default async function LeagueMatchesPage({
  params,
}: LeagueMatchesPageProps) {
  const { sport: sportParam, leagueId } = await params;
  if (!isValidSport(sportParam)) notFound();

  const config = getCatalogApiConfig();
  const numericLeagueId = Number(leagueId);

  if (
    config.enabled &&
    sportParam === "football" &&
    Number.isFinite(numericLeagueId)
  ) {
    const catalogLeagues = await fetchCatalogLeaguesForSport("football");
    const league = catalogLeagueById(catalogLeagues, numericLeagueId);
    if (!league) notFound();

    const matches = await fetchCatalogMatchesForLeague(numericLeagueId);
    const countryName = countryDisplayName(league.countrySlug);

    return (
      <div className="space-y-4">
        <div>
          <Link
            href={`/leagues/${sportParam}/country/${league.countrySlug}`}
            className="text-[11px] font-medium text-brand hover:underline"
          >
            ← {countryName}
          </Link>
          <h1 className="page-title mt-1">{league.name}</h1>
          <p className="text-xs text-muted">
            {matches.length}{" "}
            {matches.length === 1 ? "match" : "matches"} from BetPlus
          </p>
        </div>

        {matches.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">
            No matches right now.
          </p>
        ) : (
          <div className="home-feed -mx-3 match-list sm:mx-0">
            {matches.map((match) => (
              <MatchRow key={match.id} match={match} showLeague={false} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const league = getLeagueById(leagueId);
  if (!league || league.sport !== sportParam) notFound();

  const country = getCountryById(league.countryId);
  const matches = getMatchesForLeague(leagueId);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={
            country
              ? `/leagues/${sportParam}/country/${country.id}`
              : `/leagues/${sportParam}`
          }
          className="text-[11px] font-medium text-brand hover:underline"
        >
          ← {country?.name ?? sportLabel(league.sport)}
        </Link>
        <h1 className="page-title mt-1">{league.name}</h1>
        <p className="text-xs text-muted">
          {matches.length} {matches.length === 1 ? "match" : "matches"} available
        </p>
      </div>

      {matches.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted">No matches right now.</p>
      ) : (
        <div className="home-feed -mx-3 match-list sm:mx-0">
          {matches.map((match) => (
            <MatchRow key={match.id} match={match} showLeague={false} />
          ))}
        </div>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import { MatchMarkets } from "@/components/MatchMarkets";
import { catalogMatchByIdStep } from "@/lib/catalog-fetch.server";
import { getCatalogApiConfig } from "@/lib/catalog-config.server";
import { getMatchById } from "@/lib/mock-data";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const config = getCatalogApiConfig();

  let match = config.enabled ? (await catalogMatchByIdStep(id)).match : null;
  if (!match) {
    match = getMatchById(id) ?? null;
  }

  if (!match) notFound();

  return <MatchMarkets match={match} />;
}

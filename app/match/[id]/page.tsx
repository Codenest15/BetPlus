import { notFound } from "next/navigation";
import { MatchMarkets } from "@/components/MatchMarkets";
import { getMatchForPage } from "@/lib/catalog";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatchForPage(id);

  if (!match) notFound();

  return <MatchMarkets match={match} />;
}

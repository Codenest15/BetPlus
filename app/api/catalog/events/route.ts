import { NextResponse } from "next/server";
import {
  catalogEventsStep,
  getStoredCatalogToken,
} from "@/lib/catalog-fetch.server";

export async function GET(request: Request) {
  const started = Date.now();
  const token = await getStoredCatalogToken();
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        step: "events",
        error: "Call /api/catalog/auth first",
        ms: Date.now() - started,
      },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport") ?? undefined;
  const leagueIdRaw = searchParams.get("league_id");
  const leagueId =
    leagueIdRaw && Number.isFinite(Number(leagueIdRaw))
      ? Number(leagueIdRaw)
      : undefined;

  try {
    const result = await catalogEventsStep(token, { sport, leagueId });
    return NextResponse.json({
      ok: true,
      step: "events",
      source: result.source,
      events: result.events,
      ms: Date.now() - started,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        step: "events",
        error: error instanceof Error ? error.message : "Events failed",
        ms: Date.now() - started,
      },
      { status: 502 },
    );
  }
}

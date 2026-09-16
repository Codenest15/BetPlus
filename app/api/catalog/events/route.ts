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
  const statusRaw = searchParams.get("status");
  const status =
    statusRaw === "live" || statusRaw === "upcoming" || statusRaw === "all"
      ? statusRaw
      : undefined;
  const date = searchParams.get("date") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const windowDaysRaw = searchParams.get("window_days");
  const windowDays =
    windowDaysRaw && Number.isFinite(Number(windowDaysRaw))
      ? Number(windowDaysRaw)
      : undefined;
  const limitRaw = searchParams.get("limit");
  const limit =
    limitRaw && Number.isFinite(Number(limitRaw))
      ? Number(limitRaw)
      : 30;
  const offsetRaw = searchParams.get("offset");
  const offset =
    offsetRaw && Number.isFinite(Number(offsetRaw))
      ? Number(offsetRaw)
      : 0;

  try {
    const result = await catalogEventsStep(token, {
      sport,
      leagueId,
      status,
      date,
      search,
      windowDays,
      limit,
      offset,
    });
    return NextResponse.json({
      ok: true,
      step: "events",
      source: result.source,
      events: result.events,
      hasMore: result.events.length >= limit,
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

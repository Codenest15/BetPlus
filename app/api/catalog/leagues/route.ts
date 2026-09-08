import { NextResponse } from "next/server";
import {
  catalogLeaguesStep,
  getStoredCatalogToken,
} from "@/lib/catalog-fetch.server";

export async function GET(request: Request) {
  const started = Date.now();
  const token = await getStoredCatalogToken();
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        step: "leagues",
        error: "Call /api/catalog/auth first",
        ms: Date.now() - started,
      },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const sportIdRaw = searchParams.get("sport_id");
  const sportId =
    sportIdRaw && Number.isFinite(Number(sportIdRaw))
      ? Number(sportIdRaw)
      : undefined;

  try {
    const result = await catalogLeaguesStep(token, sportId);
    return NextResponse.json({
      ok: true,
      step: "leagues",
      source: result.source,
      leagues: result.leagues,
      ms: Date.now() - started,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        step: "leagues",
        error: error instanceof Error ? error.message : "Leagues failed",
        ms: Date.now() - started,
      },
      { status: 502 },
    );
  }
}

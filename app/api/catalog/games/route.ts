import { NextResponse } from "next/server";
import {
  catalogGamesStep,
  getStoredCatalogToken,
} from "@/lib/catalog-fetch.server";

export async function GET() {
  const started = Date.now();
  const token = await getStoredCatalogToken();
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        step: "games",
        error: "Call /api/catalog/auth first",
        ms: Date.now() - started,
      },
      { status: 401 },
    );
  }

  try {
    const result = await catalogGamesStep(token);
    return NextResponse.json({
      ok: true,
      step: "games",
      source: result.source,
      games: result.games,
      ms: Date.now() - started,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        step: "games",
        error: error instanceof Error ? error.message : "Games failed",
        ms: Date.now() - started,
      },
      { status: 502 },
    );
  }
}

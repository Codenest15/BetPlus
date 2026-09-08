import { NextResponse } from "next/server";
import {
  catalogSportsStep,
  getStoredCatalogToken,
} from "@/lib/catalog-fetch.server";

export async function GET() {
  const started = Date.now();
  const token = await getStoredCatalogToken();
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        step: "sports",
        error: "Call /api/catalog/auth first",
        ms: Date.now() - started,
      },
      { status: 401 },
    );
  }

  try {
    const result = await catalogSportsStep(token);
    return NextResponse.json({
      ok: true,
      step: "sports",
      source: result.source,
      sports: result.sports,
      ms: Date.now() - started,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        step: "sports",
        error: error instanceof Error ? error.message : "Sports failed",
        ms: Date.now() - started,
      },
      { status: 502 },
    );
  }
}

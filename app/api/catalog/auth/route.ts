import { NextResponse } from "next/server";
import { catalogAuthStep } from "@/lib/catalog-fetch.server";
import { getCatalogApiConfig } from "@/lib/catalog-config.server";

export const dynamic = "force-dynamic";

export async function POST() {
  const started = Date.now();
  try {
    const result = await catalogAuthStep();
    return NextResponse.json({
      ok: true,
      step: "auth",
      source: result.source,
      ms: Date.now() - started,
      configured: getCatalogApiConfig().enabled,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        step: "auth",
        error: error instanceof Error ? error.message : "Auth failed",
        ms: Date.now() - started,
      },
      { status: 502 },
    );
  }
}

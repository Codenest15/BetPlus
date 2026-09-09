import { NextResponse } from "next/server";
import { resolveTeamCrestUrl } from "@/lib/team-crest-resolve.server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get("team")?.trim();
  const format = searchParams.get("format");

  if (!team) {
    return NextResponse.json({ error: "Missing team" }, { status: 400 });
  }

  const badgeUrl = await resolveTeamCrestUrl(team);
  if (!badgeUrl) {
    return NextResponse.json({ error: "Crest not found" }, { status: 404 });
  }

  const cacheControl =
    "public, max-age=86400, stale-while-revalidate=604800";

  if (format === "json") {
    return NextResponse.json(
      { url: badgeUrl },
      { headers: { "Cache-Control": cacheControl } },
    );
  }

  return NextResponse.redirect(badgeUrl, {
    status: 302,
    headers: { "Cache-Control": cacheControl },
  });
}

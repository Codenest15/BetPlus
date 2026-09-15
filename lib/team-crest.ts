/** Resolve crest image URL — catalog logo first, then app lookup route for any team. */
export function getTeamCrestUrl(
  teamName: string,
  explicitUrl?: string | null,
): string {
  if (explicitUrl?.trim()) return explicitUrl.trim();
  return `/api/team-crest?team=${encodeURIComponent(teamName.trim())}`;
}

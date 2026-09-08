export const HEADER_NAV_TABS = [
  {
    href: "/",
    label: "Sports",
    match: (p: string) => p === "/" || p.startsWith("/match/"),
  },
  { href: "/live", label: "Live", match: (p: string) => p.startsWith("/live") },
  { href: "/games", label: "Games", match: (p: string) => p.startsWith("/games") },
  {
    href: "/leagues",
    label: "Leagues",
    match: (p: string) => p.startsWith("/leagues"),
  },
  {
    href: "/verify",
    label: "Verify",
    match: (p: string) => p.startsWith("/verify"),
  },
] as const;

"use client";

import { useEffect, useState } from "react";
import { getLeagueLogoUrl } from "@/lib/league-logos";

interface LeagueLogoProps {
  tabId: string;
  leagueName: string;
  size?: number;
}

export function LeagueLogo({ tabId, leagueName, size = 18 }: LeagueLogoProps) {
  const initial = getLeagueLogoUrl(tabId, leagueName);
  const [src, setSrc] = useState<string | null>(initial);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    setSrc(getLeagueLogoUrl(tabId, leagueName));
  }, [tabId, leagueName]);

  if (!src || failed) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded bg-brand-soft/50 text-[10px] font-bold text-brand-dark"
        style={{ width: size, height: size }}
        aria-hidden
      >
        {leagueName.trim().charAt(0).toUpperCase() || "?"}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      aria-hidden
      referrerPolicy="no-referrer"
      className="shrink-0 object-contain"
      style={{ width: size, height: size, maxWidth: size, maxHeight: size }}
      onError={() => setFailed(true)}
    />
  );
}

"use client";

import { useEffect, useState } from "react";

interface TeamCrestProps {
  teamName: string;
  logoUrl?: string | null;
  size?: number;
  watermark?: boolean;
}

const clientCrestCache = new Map<string, string | null>();

async function resolveCrestSrc(
  teamName: string,
  explicitUrl?: string | null,
): Promise<string | null> {
  if (explicitUrl?.trim()) return explicitUrl.trim();

  const key = teamName.trim().toLowerCase();
  if (clientCrestCache.has(key)) return clientCrestCache.get(key) ?? null;

  try {
    const res = await fetch(
      `/api/team-crest?team=${encodeURIComponent(teamName.trim())}&format=json`,
    );
    if (!res.ok) {
      clientCrestCache.set(key, null);
      return null;
    }
    const data = (await res.json()) as { url?: string };
    const url = data.url?.trim() ?? null;
    clientCrestCache.set(key, url);
    return url;
  } catch {
    clientCrestCache.set(key, null);
    return null;
  }
}

function GenericCrest({ size, watermark }: { size: number; watermark?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden
      className={
        watermark
          ? "pointer-events-none opacity-[0.07]"
          : "text-brand drop-shadow-sm"
      }
    >
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="currentColor"
        opacity={watermark ? 1 : 0.12}
      />
      <path
        d="M32 10c-8 6-18 8-18 8v14c0 12 8 22 18 26 10-4 18-14 18-26V18s-10-2-18-8z"
        fill="currentColor"
        opacity={watermark ? 0.35 : 0.85}
      />
    </svg>
  );
}

export function TeamCrest({
  teamName,
  logoUrl,
  size = 56,
  watermark = false,
}: TeamCrestProps) {
  const [src, setSrc] = useState<string | null>(
    logoUrl?.trim() ? logoUrl.trim() : null,
  );
  const [loading, setLoading] = useState(!logoUrl?.trim());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (logoUrl?.trim()) {
      setSrc(logoUrl.trim());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void resolveCrestSrc(teamName, logoUrl).then((url) => {
      if (!cancelled) {
        setSrc(url);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [teamName, logoUrl]);

  if (loading) {
    return (
      <span
        className="inline-block animate-pulse rounded-full bg-brand-soft/40"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  if (failed || !src) {
    return <GenericCrest size={size} watermark={watermark} />;
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
      className={
        watermark
          ? "pointer-events-none object-contain opacity-[0.07]"
          : "object-contain drop-shadow-sm"
      }
      onError={() => setFailed(true)}
    />
  );
}

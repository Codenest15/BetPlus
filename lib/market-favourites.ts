"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "betplus_favourite_market_ids";

export function loadFavouriteMarketIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function saveFavouriteMarketIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useFavouriteMarkets() {
  const [favourites, setFavourites] = useState<string[]>([]);

  useEffect(() => {
    setFavourites(loadFavouriteMarketIds());
  }, []);

  const toggle = useCallback((marketId: string) => {
    setFavourites((prev) => {
      const next = prev.includes(marketId)
        ? prev.filter((id) => id !== marketId)
        : [...prev, marketId];
      saveFavouriteMarketIds(next);
      return next;
    });
  }, []);

  const isFavourite = useCallback(
    (marketId: string) => favourites.includes(marketId),
    [favourites],
  );

  return { favourites, toggle, isFavourite };
}

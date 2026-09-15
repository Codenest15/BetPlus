"use client";

import type { MarketCategory } from "@/lib/types";
import { ScrollRow } from "./ScrollRow";

interface MarketCategoryTabsProps {
  categories: { id: MarketCategory; label: string }[];
  active: MarketCategory;
  onChange: (category: MarketCategory) => void;
  live?: boolean;
}

export function MarketCategoryTabs({
  categories,
  active,
  onChange,
  live = false,
}: MarketCategoryTabsProps) {
  return (
    <div
      className={`sticky top-[5.5rem] z-20 border-b shadow-sm md:top-12 ${
        live ? "match-live-tabs" : "border-border bg-surface"
      }`}
    >
      <ScrollRow bleed={false} trackClassName="gap-0 py-0">
        {categories.map((cat) => {
          const isActive = active === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(cat.id)}
              className={`relative shrink-0 px-3.5 py-3 text-xs font-medium transition-colors ${
                live
                  ? isActive
                    ? "font-semibold text-white"
                    : "text-white/55 hover:text-white/80"
                  : isActive
                    ? "font-semibold text-brand-dark"
                    : "text-muted hover:text-foreground"
              }`}
            >
              {cat.label}
              {isActive && (
                <span
                  className={`absolute inset-x-1 bottom-0 h-0.5 rounded-full ${
                    live ? "bg-live" : "bg-brand-dark"
                  }`}
                />
              )}
            </button>
          );
        })}
      </ScrollRow>
    </div>
  );
}

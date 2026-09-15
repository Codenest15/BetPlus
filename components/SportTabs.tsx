"use client";

import { AppIcon } from "@/components/AppIcon";
import { SPORTS } from "@/lib/mock-data";
import type { Sport } from "@/lib/types";
import { ScrollRow } from "./ScrollRow";

interface SportTabsProps {
  active: Sport | "all";
  onChange: (sport: Sport | "all") => void;
}

const pillClass = (active: boolean) =>
  `shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium ${
    active
      ? "bg-brand-dark text-white"
      : "bg-surface-elevated text-muted"
  }`;

export function SportTabs({ active, onChange }: SportTabsProps) {
  return (
    <ScrollRow fadeEdge trackClassName="py-0.5">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={pillClass(active === "all")}
      >
        All
      </button>
      {SPORTS.map((sport) => (
        <button
          key={sport.id}
          type="button"
          onClick={() => onChange(sport.id)}
          className={`flex ${pillClass(active === sport.id)} items-center gap-1`}
        >
          <AppIcon name={sport.icon} size={16} />
          {sport.label}
        </button>
      ))}
    </ScrollRow>
  );
}

"use client";

import { AppIcon } from "@/components/AppIcon";
import { useCatalog } from "@/lib/catalog-context";
import { SPORTS } from "@/lib/mock-data";
import type { IconId } from "@/lib/icons";
import type { Sport } from "@/lib/types";
import { ScrollRow } from "./ScrollRow";

interface SportTabsProps {
  active: Sport | "all";
  onChange: (sport: Sport | "all") => void;
}

const SPORT_ICONS: Record<Sport, IconId> = {
  football: "football",
  basketball: "basketball",
  baseball: "baseball",
  hockey: "hockey",
};

const pillClass = (active: boolean) =>
  `shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium ${
    active
      ? "bg-brand-dark text-white"
      : "bg-surface-elevated text-muted"
  }`;

export function SportTabs({ active, onChange }: SportTabsProps) {
  const { sports, source } = useCatalog();

  const tabs =
    source === "api" && sports.length > 0
      ? sports.map((item) => ({
          id: (item.slug ?? item.id) as Sport | "all",
          label: item.label,
          icon: SPORT_ICONS[(item.slug ?? item.id) as Sport] ?? "football",
        }))
      : SPORTS.map((sport) => ({
          id: sport.id,
          label: sport.label,
          icon: sport.icon,
        }));

  return (
    <ScrollRow fadeEdge trackClassName="py-0.5">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={pillClass(active === "all")}
      >
        All
      </button>
      {tabs.map((sport) => (
        <button
          key={sport.id}
          type="button"
          onClick={() => onChange(sport.id as Sport)}
          className={`flex ${pillClass(active === sport.id)} items-center gap-1`}
        >
          <AppIcon name={sport.icon} size={16} />
          {sport.label}
        </button>
      ))}
    </ScrollRow>
  );
}

"use client";

const TABS = [
  { id: "live", label: "Live" },
  { id: "soon", label: "Today" },
  { id: "all", label: "All" },
] as const;

export type SectionTab = (typeof TABS)[number]["id"];

interface SectionTabsProps {
  active: SectionTab;
  onChange: (tab: SectionTab) => void;
}

export function SectionTabs({ active, onChange }: SectionTabsProps) {
  return (
    <div className="flex justify-center px-2">
      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
        {TABS.map((tab) => {
          const isActive = active === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`relative shrink-0 px-4 py-2.5 text-xs font-medium transition-colors sm:px-5 ${
                isActive ? "font-semibold text-brand-dark" : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-brand-dark" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

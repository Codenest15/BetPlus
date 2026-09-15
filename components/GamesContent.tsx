"use client";

import { useMemo, useState } from "react";
import { GAMES, GAME_CATEGORIES } from "@/lib/games-data";

function GameComingSoonRow({ title }: { title: string }) {
  return (
    <div className="match-row flex items-center justify-between gap-3 py-3">
      <span className="text-sm font-medium text-foreground">{title}</span>
      <span className="shrink-0 text-xs font-medium text-muted">Coming soon</span>
    </div>
  );
}

export function GamesContent() {
  const [category, setCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    if (category === "All") return GAMES;
    return GAMES.filter((game) => game.category === category);
  }, [category]);

  return (
    <div className="-mx-3 space-y-0 sm:mx-0">
      <div className="px-3 pb-2 sm:px-0">
        <h1 className="page-title">Games</h1>
        <p className="mt-0.5 text-xs text-muted">Crash, slots, virtual &amp; table</p>
      </div>

      <div className="home-feed">
        <div className="home-toolbar py-1">
          <div className="flex gap-1.5 overflow-x-auto px-3 pb-2 scrollbar-hide sm:px-0">
            {GAME_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  category === cat
                    ? "bg-brand text-white"
                    : "bg-surface-elevated text-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="match-list">
          {filtered.map((game) => (
            <GameComingSoonRow key={game.id} title={game.title} />
          ))}
        </div>
      </div>
    </div>
  );
}

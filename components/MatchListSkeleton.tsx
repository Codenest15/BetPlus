export function MatchListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="match-list" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="match-row animate-pulse">
          <div className="mb-2 h-3 w-40 rounded bg-surface-elevated" />
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-surface-elevated" />
              <div className="h-4 w-2/3 rounded bg-surface-elevated" />
            </div>
            <div className="flex w-[46%] gap-1">
              <div className="h-10 flex-1 rounded bg-surface-elevated" />
              <div className="h-10 flex-1 rounded bg-surface-elevated" />
              <div className="h-10 flex-1 rounded bg-surface-elevated" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

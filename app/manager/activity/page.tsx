"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ManagerGate } from "@/components/manager/ManagerGate";
import {
  getManagerAuditLog,
  type ManagerAuditEntry,
} from "@/lib/manager-store";

export default function ManagerActivityPage() {
  const [log, setLog] = useState<ManagerAuditEntry[]>([]);

  useEffect(() => {
    setLog(getManagerAuditLog());
  }, []);

  return (
    <ManagerGate>
      <div className="space-y-4">
        <Link href="/manager" className="text-xs text-brand hover:underline">
          ← Manager home
        </Link>
        <div>
          <h1 className="page-title">Activity</h1>
          <p className="mt-0.5 text-xs text-muted">
            Log of match updates made by managers.
          </p>
        </div>

        <div className="card overflow-hidden">
          {log.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted">
              No activity yet.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {log.map((entry) => (
                <li key={entry.id} className="px-3 py-2.5 text-xs">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-brand-dark">
                      {entry.action}
                    </span>
                    <span className="text-[10px] text-muted">
                      {new Date(entry.at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-0.5 text-muted">{entry.detail}</p>
                  {entry.matchId && (
                    <Link
                      href={`/manager/matches/${entry.matchId}`}
                      className="mt-1 inline-block text-[10px] text-brand hover:underline"
                    >
                      View match
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ManagerGate>
  );
}

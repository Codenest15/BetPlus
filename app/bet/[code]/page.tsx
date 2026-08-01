"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TicketDetails } from "@/components/TicketDetails";
import { useAuth } from "@/lib/auth-context";
import { getBetByCode } from "@/lib/bet-store";
import type { PlacedBet } from "@/lib/bet-types";

export default function BetTicketPage() {
  const params = useParams();
  const code = (params.code as string)?.toUpperCase();
  const { refreshUser } = useAuth();
  const [bet, setBet] = useState<PlacedBet | null>(null);

  useEffect(() => {
    if (!code) return;
    setBet(getBetByCode(code));
    refreshUser();
  }, [code, refreshUser]);

  if (!bet) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-10 text-center">
        <h1 className="page-title">Not found</h1>
        <p className="mt-2 text-xs text-muted">
          No ticket for <span className="font-mono">{code}</span>
        </p>
        <Link
          href="/verify"
          className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-xs font-semibold text-white"
        >
          Try another code
        </Link>
      </div>
    );
  }

  return (
    <TicketDetails
      bet={bet}
      onBetUpdate={(updated) => setBet(updated)}
    />
  );
}

"use client";

import Link from "next/link";

interface AccountBackLinkProps {
  className?: string;
  light?: boolean;
}

export function AccountBackLink({ className = "", light = false }: AccountBackLinkProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-1 text-xs font-medium hover:underline ${
        light ? "text-white/70 hover:text-white" : "text-brand hover:text-brand-dark"
      } ${className}`}
    >
      ← Back to Home
    </Link>
  );
}

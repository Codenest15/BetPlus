"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { BetPlusLogo } from "@/components/BetPlusLogo";
import { useAuth } from "@/lib/auth-context";
import { useMatchSearch } from "@/lib/match-search-context";
import { HEADER_NAV_TABS } from "@/lib/nav-tabs";
import type { User } from "@/lib/user-types";
import { formatCurrency, CURRENCY_CODE } from "@/lib/utils";
import { ScrollRow } from "./ScrollRow";

function SearchIcon({ active }: { active?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`h-[18px] w-[18px] ${active ? "text-brand-accent" : "text-white"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10.5" cy="10.5" r="6.75" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function SearchCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close search"
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10.5L12 4l8 6.5" />
      <path d="M6 9.75V19a1 1 0 001 1h3v-5h4v5h3a1 1 0 001-1V9.75" />
    </svg>
  );
}

function HeaderHomeLink() {
  return (
    <Link
      href="/"
      aria-label="Home"
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-white transition hover:text-white/90"
    >
      <HomeIcon />
    </Link>
  );
}

const HEADER_CHIP =
  "inline-flex h-8 shrink-0 items-center rounded-md text-xs font-bold leading-none";

function HeaderSearchButton({
  active,
  onClick,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Search matches"
      aria-expanded={active}
      className={`inline-flex h-8 w-8 items-center justify-center transition-colors ${
        active ? "text-brand-accent" : "text-white hover:text-white/90"
      } ${className}`}
    >
      <SearchIcon active={active} />
    </button>
  );
}

function HeaderUserActions({ user }: { user: User }) {
  const initial = user.name.charAt(0).toUpperCase();

  return (
    <>
      <Link
        href="/wallet"
        className={`${HEADER_CHIP} bg-white px-3 text-brand-dark shadow-sm transition hover:brightness-95 active:brightness-90`}
      >
        Deposit
      </Link>
      <Link
        href="/account"
        className={`${HEADER_CHIP} max-w-[10rem] gap-2 border border-white/90 px-2 text-white transition hover:bg-white/10 sm:max-w-none`}
        aria-label="Account"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
          {initial}
        </span>
        <span className="truncate tabular-nums tracking-tight">
          {CURRENCY_CODE} {formatCurrency(user.balance)}
        </span>
      </Link>
    </>
  );
}

function NavLink({
  href,
  label,
  active,
  compact = false,
}: {
  href: string;
  label: string;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full transition-colors ${
        compact ? "px-3 py-1.5 text-xs" : "px-3 py-1.5 text-sm"
      } ${
        active
          ? "bg-white/15 font-semibold text-white"
          : "text-white/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isAccountPage = pathname?.startsWith("/account");
  const router = useRouter();
  const { user, openLogin, openRegister } = useAuth();
  const { query, setQuery, open, toggle, close, searching } = useMatchSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const openSearch = () => {
    if (pathname !== "/" && !pathname.startsWith("/match/")) {
      router.push("/");
    }
    toggle();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-brand/20 bg-brand-dark text-white shadow-sm">
      <div className="relative mx-auto flex h-12 max-w-7xl items-center justify-between gap-2 px-3">
        <Link href="/" className="flex shrink-0 items-center py-1">
          <BetPlusLogo size="sm" variant="light" />
        </Link>

        {!isAccountPage && (
        <nav className="pointer-events-none absolute inset-x-0 hidden items-center justify-center gap-1 md:flex">
          <div className="pointer-events-auto flex items-center gap-1">
          {HEADER_NAV_TABS.map((tab) => (
            <NavLink
              key={tab.href}
              href={tab.href}
              label={tab.label}
              active={tab.match(pathname)}
            />
          ))}
          </div>
        </nav>
        )}

        <div className="relative z-10 ml-auto flex shrink-0 items-center gap-2">
          {!open && (
            <HeaderSearchButton active={searching} onClick={openSearch} />
          )}
          {open && (
            <div className="hidden max-w-xs items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 md:flex">
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search team, league, or match ID…"
                aria-label="Search matches"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="shrink-0 text-xs font-medium text-brand-accent hover:underline"
                >
                  Clear
                </button>
              ) : (
                <SearchCloseButton onClick={close} />
              )}
            </div>
          )}
          {!isHomePage ? (
            <HeaderHomeLink />
          ) : user ? (
            <HeaderUserActions user={user} />
          ) : (
            <>
              <button
                type="button"
                onClick={openLogin}
                className="text-xs font-medium text-white/90 hover:text-white sm:text-sm"
              >
                Login
              </button>
              <button
                type="button"
                onClick={openRegister}
                className="rounded-full bg-brand-accent px-2.5 py-1 text-xs font-semibold text-brand-dark hover:brightness-95 sm:px-3.5 sm:py-1.5 sm:text-sm"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>

      {!isAccountPage && (
        <nav
          aria-label="Main"
          className="border-t border-white/10 md:hidden"
        >
          <ScrollRow bleed={false} trackClassName="gap-1 py-2">
            {HEADER_NAV_TABS.map((tab) => (
              <NavLink
                key={tab.href}
                href={tab.href}
                label={tab.label}
                active={tab.match(pathname)}
                compact
              />
            ))}
          </ScrollRow>
        </nav>
      )}

      {open && (
        <div className="border-t border-white/10 px-3 py-2 md:hidden">
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
            <SearchIcon active />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search team, league, or match ID…"
              aria-label="Search matches"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="shrink-0 text-xs font-medium text-brand-accent hover:underline"
              >
                Clear
              </button>
            ) : (
              <SearchCloseButton onClick={close} />
            )}
          </div>
        </div>
      )}
    </header>
  );
}

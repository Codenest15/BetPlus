"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface MatchSearchContextValue {
  query: string;
  setQuery: (query: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  close: () => void;
  searching: boolean;
}

const MatchSearchContext = createContext<MatchSearchContextValue | null>(null);

export function MatchSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const toggle = useCallback(() => {
    setOpen((value) => !value);
  }, []);

  const value = useMemo<MatchSearchContextValue>(
    () => ({
      query,
      setQuery,
      open,
      setOpen,
      toggle,
      close,
      searching: query.trim().length > 0,
    }),
    [query, open, toggle, close],
  );

  return (
    <MatchSearchContext.Provider value={value}>
      {children}
    </MatchSearchContext.Provider>
  );
}

export function useMatchSearch() {
  const ctx = useContext(MatchSearchContext);
  if (!ctx) {
    throw new Error("useMatchSearch must be used within MatchSearchProvider");
  }
  return ctx;
}

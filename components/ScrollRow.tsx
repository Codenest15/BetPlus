import type { ReactNode } from "react";

interface ScrollRowProps {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  /** When false, scroll stays within the parent (e.g. header nav). Default: true */
  bleed?: boolean;
  /** Fade on the right edge to hint that more items scroll horizontally. */
  fadeEdge?: boolean;
}

/**
 * Horizontal scroll row. With bleed (default), extends into the page gutter so
 * first/last pills are not clipped and can scroll fully into view.
 */
export function ScrollRow({
  children,
  className = "",
  trackClassName = "",
  bleed = true,
  fadeEdge = false,
}: ScrollRowProps) {
  return (
    <div
      className={`scroll-row-wrap ${fadeEdge ? "scroll-row-fade" : ""} min-w-0 w-full max-w-full ${className}`}
    >
      <div
        className={`scroll-row scrollbar-hide w-full min-w-0 max-w-full ${bleed ? "scroll-row-bleed" : "scroll-row-contained"}`}
      >
        <div className={`scroll-row-track flex-nowrap ${trackClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

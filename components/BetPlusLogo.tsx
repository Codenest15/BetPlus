function LogoGlobe({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden
      className={`h-2.5 w-2.5 text-brand-soft ${className}`}
    >
      <circle cx="6" cy="6" r="5" fill="currentColor" opacity="0.35" />
      <ellipse cx="6" cy="6" rx="5" ry="2" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

export function BetPlusLogo({
  size = "md",
  variant = "default",
  className = "",
}: {
  size?: "sm" | "md";
  variant?: "default" | "light";
  className?: string;
}) {
  const word = size === "sm" ? "text-[1.15rem] sm:text-[1.35rem]" : "text-[1.35rem] sm:text-2xl";
  const plus = size === "sm" ? "text-sm sm:text-base" : "text-base sm:text-lg";
  const onDark = variant === "light";

  return (
    <span
      className={`inline-flex items-end leading-none ${className}`}
      role="img"
      aria-label="BetPlus"
    >
      <span
        className={`${word} font-extrabold tracking-tight ${
          onDark ? "text-white" : "text-brand-dark"
        }`}
      >
        be
      </span>
      <span className={`${plus} mb-0.5 font-bold text-brand-accent`}>+</span>
      <span
        className={`relative ${word} font-light tracking-tight ${
          onDark ? "text-white/90" : "text-brand"
        }`}
      >
        Pl
        <span className="relative inline-block">
          u
          <LogoGlobe
            className={`absolute -top-2.5 left-1/2 -translate-x-1/2 ${
              onDark ? "text-white/50" : ""
            }`}
          />
        </span>
        s
      </span>
    </span>
  );
}

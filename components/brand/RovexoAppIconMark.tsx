import { cn } from "@/lib/cn";

type RovexoAppIconMarkProps = {
  className?: string;
  /** Unique id prefix when multiple marks render on one page */
  uid?: string;
  /** Disable outer glow filter so the mark stays inside fixed header bounds */
  contained?: boolean;
};

/** Official ROVEXO RX app icon — premium monogram on dark rounded square, X in brand purple. */
export function RovexoAppIconMark({
  className,
  uid = "rx",
  contained = false,
}: RovexoAppIconMarkProps) {
  const bg = `${uid}-bg`;
  const r = `${uid}-r`;
  const x = `${uid}-x`;
  const shine = `${uid}-shine`;
  const glow = `${uid}-glow`;

  const icon = (
    <>
      <rect x="96" y="96" width="832" height="832" rx="196" fill={`url(#${bg})`} />
      <rect x="96" y="96" width="832" height="832" rx="196" fill={`url(#${shine})`} />
      <path
        fill={`url(#${r})`}
        d="M248 736V288h118c56.8 0 92 30.2 92 75.6 0 32.9-16.7 55.5-45.5 66.2l61.8 129.2h-55.5L384.8 542.2H316V736H248Zm54.2-154.2h58.2c27.2 0 42.4-12.7 42.4-35.7 0-22.5-15.2-35.7-42.4-35.7h-58.2v71.4Z"
      />
      <path
        fill={`url(#${x})`}
        d="M548 288 672 512 548 736h78l74-134 74 134h78L624 512 778 288h-78l-74 132L552 288H548Z"
      />
      <ellipse cx="360" cy="300" rx="168" ry="88" fill="#FFFFFF" opacity="0.14" />
    </>
  );

  return (
    <svg
      viewBox="0 0 1024 1024"
      preserveAspectRatio="xMidYMid meet"
      className={cn("block h-full w-full max-h-full max-w-full shrink-0", className)}
      aria-hidden
      fill="none"
    >
      <defs>
        <linearGradient id={bg} x1="128" y1="96" x2="896" y2="928" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0B1224" />
          <stop offset="0.55" stopColor="#101A33" />
          <stop offset="1" stopColor="#0A1020" />
        </linearGradient>
        <linearGradient id={r} x1="220" y1="220" x2="460" y2="820" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8FAFC" />
          <stop offset="0.55" stopColor="#E2E8F0" />
          <stop offset="1" stopColor="#CBD5E1" />
        </linearGradient>
        <linearGradient id={x} x1="540" y1="240" x2="780" y2="780" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C084FC" />
          <stop offset="0.45" stopColor="#A855F7" />
          <stop offset="0.78" stopColor="#9333EA" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id={shine} x1="220" y1="180" x2="520" y2="420" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.42" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        {!contained ? (
          <filter id={glow} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="18" stdDeviation="28" floodColor="#9333EA" floodOpacity="0.35" />
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#A855F7" floodOpacity="0.28" />
          </filter>
        ) : null}
      </defs>
      {contained ? icon : <g filter={`url(#${glow})`}>{icon}</g>}
    </svg>
  );
}

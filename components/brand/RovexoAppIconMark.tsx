import { cn } from "@/lib/cn";

type RovexoAppIconMarkProps = {
  className?: string;
  /** Unique id prefix when multiple marks render on one page */
  uid?: string;
  /** Disable outer glow filter so the mark stays inside fixed header bounds */
  contained?: boolean;
};

/** Official ROVEXO app icon — premium 3D R on dark navy rounded square */
export function RovexoAppIconMark({
  className,
  uid = "rx",
  contained = false,
}: RovexoAppIconMarkProps) {
  const bg = `${uid}-bg`;
  const r = `${uid}-r`;
  const shine = `${uid}-shine`;
  const glow = `${uid}-glow`;

  const icon = (
    <>
      <rect x="96" y="96" width="832" height="832" rx="196" fill={`url(#${bg})`} />
      <rect x="96" y="96" width="832" height="832" rx="196" fill={`url(#${shine})`} />
      <path
        fill={`url(#${r})`}
        d="M312 736V288h148c71.4 0 115.5 38 115.5 95.2 0 41.4-21 69.8-57.2 83.2l77.6 161.6h-69.7l-67.4-141.4H376.8V736H312Zm68.2-193.8h73c34.2 0 53.2-16 53.2-44.8 0-28.3-19-44.8-53.2-44.8h-73v89.6Z"
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
        <linearGradient id={r} x1="300" y1="220" x2="760" y2="820" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA" />
          <stop offset="0.45" stopColor="#6366F1" />
          <stop offset="0.78" stopColor="#A855F7" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id={shine} x1="220" y1="180" x2="520" y2="420" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.42" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        {!contained ? (
          <filter id={glow} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="18" stdDeviation="28" floodColor="#2563EB" floodOpacity="0.35" />
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#A855F7" floodOpacity="0.28" />
          </filter>
        ) : null}
      </defs>
      {contained ? icon : <g filter={`url(#${glow})`}>{icon}</g>}
    </svg>
  );
}

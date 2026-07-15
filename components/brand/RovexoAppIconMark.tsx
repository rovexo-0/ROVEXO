import { cn } from "@/lib/cn";

type RovexoAppIconMarkProps = {
  className?: string;
  /** Unique id prefix when multiple marks render on one page */
  uid?: string;
  /** Disable outer glow filter so the mark stays inside fixed header bounds */
  contained?: boolean;
};

/**
 * Official ROVEXO RX app icon — synced with brand/rovexo-app-icon.svg.
 * Black plate · white R · elegant purple X · soft rounded corners.
 */
export function RovexoAppIconMark({
  className,
  uid = "rx",
  contained = false,
}: RovexoAppIconMarkProps) {
  const bg = `${uid}-bg`;
  const x = `${uid}-x`;
  const shine = `${uid}-shine`;
  const glow = `${uid}-glow`;

  const icon = (
    <>
      <rect x="90" y="90" width="844" height="844" rx="240" fill={`url(#${bg})`} />
      <rect x="90" y="90" width="844" height="844" rx="240" fill={`url(#${shine})`} />
      <g transform="translate(512 512) scale(1.03) translate(-512 -512)">
        <path
          fill="#FFFFFF"
          d="M236 736V288h128c66 0 104 35 104 92 0 40-18 68-52 82l68 274h-70L348 492H312v244H236Zm76-292h62c28 0 46-14 46-40s-18-40-46-40h-62v80Z"
        />
        <path
          fill={`url(#${x})`}
          d="M600 296l108 216L600 728h66l72-132 72 132h66L734 512l134-216h-66l-72 130L666 296h-66Z"
        />
      </g>
    </>
  );

  return (
    <svg
      viewBox="0 0 1024 1024"
      preserveAspectRatio="xMidYMid meet"
      className={cn("block h-full w-full max-h-full max-w-full shrink-0", className)}
      aria-hidden
      fill="none"
      data-rx-icon="v1.0-icon-polish"
    >
      <defs>
        <linearGradient id={bg} x1="128" y1="96" x2="896" y2="928" gradientUnits="userSpaceOnUse">
          <stop stopColor="#080B14" />
          <stop offset="0.48" stopColor="#0B1224" />
          <stop offset="1" stopColor="#060810" />
        </linearGradient>
        <linearGradient id={x} x1="590" y1="280" x2="860" y2="760" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA" />
          <stop offset="0.45" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id={shine} x1="200" y1="150" x2="540" y2="440" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.09" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        {!contained ? (
          <filter id={glow} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="#7C3AED" floodOpacity="0.12" />
            <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#0B1224" floodOpacity="0.1" />
          </filter>
        ) : null}
      </defs>
      {contained ? icon : <g filter={`url(#${glow})`}>{icon}</g>}
    </svg>
  );
}

import { cn } from "@/lib/cn";

type RovexoAppIconMarkProps = {
  className?: string;
  /** Unique id prefix when multiple marks render on one page */
  uid?: string;
  /** Disable outer glow filter so the mark stays inside fixed header bounds */
  contained?: boolean;
};

/**
 * Official ROVEXO RX app icon — final polish (synced with brand/rovexo-app-icon.svg).
 * Black plate · white R · purple X · softer rounded corners.
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
      <rect x="88" y="88" width="848" height="848" rx="228" fill={`url(#${bg})`} />
      <rect x="88" y="88" width="848" height="848" rx="228" fill={`url(#${shine})`} />
      <g transform="translate(512 512) scale(1.04) translate(-512 -512)">
        <path
          fill="#FFFFFF"
          d="M232 740V284h132c68 0 108 36 108 94 0 41-19 70-54 84l72 278h-72L350 490H312v250H232Zm78-298h64c30 0 48-15 48-42s-18-42-48-42h-64v84Z"
        />
        <path
          fill={`url(#${x})`}
          d="M588 288l116 224L588 736h74l76-140 76 140h74L722 512l142-224h-74l-76 138L662 288h-74Z"
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
      data-rx-icon="v1.0-final-polish"
    >
      <defs>
        <linearGradient id={bg} x1="120" y1="88" x2="904" y2="936" gradientUnits="userSpaceOnUse">
          <stop stopColor="#070A12" />
          <stop offset="0.45" stopColor="#0B1224" />
          <stop offset="1" stopColor="#05070E" />
        </linearGradient>
        <linearGradient id={x} x1="580" y1="270" x2="850" y2="770" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B794F6" />
          <stop offset="0.4" stopColor="#9F6AF5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id={shine} x1="180" y1="140" x2="560" y2="460" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        {!contained ? (
          <filter id={glow} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="6" stdDeviation="14" floodColor="#7C3AED" floodOpacity="0.18" />
            <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#0B1224" floodOpacity="0.12" />
          </filter>
        ) : null}
      </defs>
      {contained ? icon : <g filter={`url(#${glow})`}>{icon}</g>}
    </svg>
  );
}

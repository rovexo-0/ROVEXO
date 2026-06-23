import { cn } from "@/lib/cn";

type RovexoLogo3DProps = {
  className?: string;
};

/** Official 3D ROVEXO mark for hero banner (visual only). */
export function RovexoLogo3D({ className }: RovexoLogo3DProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("hero-logo-3d", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="rl-top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="rl-face" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="rl-shine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="rl-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.35" />
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter="url(#rl-shadow)">
        <rect x="8" y="8" width="48" height="48" rx="14" fill="url(#rl-face)" />
        <rect x="8" y="8" width="48" height="48" rx="14" fill="url(#rl-shine)" opacity="0.35" />
        <path
          fill="#ffffff"
          d="M22 42V22h8.4c4.05 0 6.55 2.15 6.55 5.4 0 2.35-1.2 3.95-3.25 4.7l4.4 9.2h-4.1l-3.85-8.05H26.2V42H22Zm3.85-11h4.15c2 0 3.1-.95 3.1-2.55 0-1.6-1.1-2.55-3.1-2.55h-4.15V31Z"
        />
        <rect x="10" y="10" width="44" height="20" rx="12" fill="url(#rl-top)" opacity="0.22" />
      </g>
    </svg>
  );
}

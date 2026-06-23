import { cn } from "@/lib/cn";

type RovexoLogo3DProps = {
  className?: string;
};

export function RovexoLogo3D({ className }: RovexoLogo3DProps) {
  return (
    <svg viewBox="0 0 72 72" className={cn("hero-logo-3d", className)} aria-hidden>
      <defs>
        <linearGradient id="rovexo-3d-top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="45%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
        <linearGradient id="rovexo-3d-face" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>
        <linearGradient id="rovexo-3d-shine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="rovexo-3d-shadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#020617" floodOpacity="0.45" />
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#3b82f6" floodOpacity="0.5" />
        </filter>
      </defs>
      <g filter="url(#rovexo-3d-shadow)">
        <rect x="10" y="10" width="52" height="52" rx="16" fill="url(#rovexo-3d-face)" />
        <rect x="10" y="10" width="52" height="52" rx="16" fill="url(#rovexo-3d-shine)" />
        <rect x="12" y="12" width="48" height="22" rx="14" fill="url(#rovexo-3d-top)" opacity="0.35" />
        <path
          fill="#ffffff"
          d="M24 48V26h9.6c4.65 0 7.5 2.45 7.5 6.15 0 2.7-1.35 4.55-3.7 5.4l5.05 10.45h-4.7l-4.4-9.2H28.4V48H24Zm4.4-12.6h4.75c2.25 0 3.55-1.1 3.55-2.9 0-1.85-1.3-2.9-3.55-2.9H28.4v5.8Z"
        />
        <ellipse cx="26" cy="24" rx="10" ry="5" fill="#ffffff" opacity="0.2" />
      </g>
    </svg>
  );
}

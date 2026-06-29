"use client";

import { memo } from "react";
import { cn } from "@/lib/cn";

type AuctionsComingSoonHeroProps = {
  className?: string;
};

export const AuctionsComingSoonHero = memo(function AuctionsComingSoonHero({
  className,
}: AuctionsComingSoonHeroProps) {
  return (
    <div className={cn("auctions-soon-hero", className)} aria-hidden>
      <svg
        viewBox="0 0 640 420"
        className="auctions-soon-hero__svg"
        role="img"
        aria-label=""
      >
        <defs>
          <linearGradient id="as-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eff6ff" />
            <stop offset="45%" stopColor="#e0e7ff" />
            <stop offset="100%" stopColor="#ede9fe" />
          </linearGradient>
          <linearGradient id="as-glow" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="as-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="as-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
          <filter id="as-sh" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.18" />
          </filter>
          <linearGradient id="as-metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        <rect width="640" height="420" rx="24" fill="url(#as-bg)" />
        <ellipse cx="480" cy="120" rx="180" ry="120" fill="url(#as-glow)" />

        <g filter="url(#as-sh)">
          <rect x="88" y="210" width="150" height="130" rx="18" fill="#f8fafc" />
          <text x="118" y="252" fill="#2563eb" fontFamily="Segoe UI, Arial, sans-serif" fontSize="18" fontWeight="800">
            ROVEXO
          </text>
          <rect x="108" y="268" width="110" height="8" rx="4" fill="#cbd5e1" />
          <rect x="108" y="286" width="86" height="8" rx="4" fill="#e2e8f0" />

          <rect x="268" y="118" width="72" height="132" rx="16" fill="#0f172a" />
          <rect x="278" y="132" width="52" height="96" rx="8" fill="url(#as-blue)" opacity="0.35" />

          <rect x="360" y="148" width="132" height="88" rx="12" fill="#cbd5e1" />
          <rect x="372" y="160" width="108" height="64" rx="8" fill="#0f172a" opacity="0.88" />

          <ellipse cx="520" cy="300" rx="44" ry="28" fill="#f8fafc" />
          <path d="M476 300 L520 268 L564 300 L548 332 H492 Z" fill="#ef4444" />

          <circle cx="430" cy="286" r="34" fill="url(#as-metal)" />
          <circle cx="430" cy="286" r="22" fill="#111827" />
          <circle cx="430" cy="286" r="10" fill="#f59e0b" />

          <rect x="500" y="168" width="96" height="56" rx="10" fill="url(#as-purple)" opacity="0.85" />
          <rect x="512" y="180" width="72" height="32" rx="6" fill="#ffffff" opacity="0.25" />

          <path d="M168 118 L208 78 L248 118 V168 H168 Z" fill="url(#as-blue)" />
          <rect x="188" y="128" width="40" height="28" rx="4" fill="#ffffff" opacity="0.35" />

          <rect x="292" y="268" width="88" height="52" rx="26" fill="url(#as-purple)" />
          <text x="336" y="302" textAnchor="middle" fill="#ffffff" fontFamily="Segoe UI, Arial, sans-serif" fontSize="16" fontWeight="800">
            BID
          </text>
        </g>
      </svg>
    </div>
  );
});

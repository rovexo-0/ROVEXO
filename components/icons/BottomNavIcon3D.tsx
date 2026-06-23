"use client";

import { useId, type ReactElement } from "react";
import { cn } from "@/lib/cn";

export type BottomNavIconType = "home" | "search" | "sell" | "saved" | "account";

type BottomNavIcon3DProps = {
  type: BottomNavIconType;
  active?: boolean;
  className?: string;
};

function IconDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-blue-top`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#93c5fd" />
        <stop offset="55%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id={`${uid}-blue-deep`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#1e40af" />
      </linearGradient>
      <linearGradient id={`${uid}-chrome`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="45%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id={`${uid}-glass`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.75" />
      </linearGradient>
      <linearGradient id={`${uid}-heart`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fca5a5" />
        <stop offset="50%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#b91c1c" />
      </linearGradient>
      <linearGradient id={`${uid}-white`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
      <linearGradient id={`${uid}-shine`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <filter id={`${uid}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="1.25" stdDeviation="1.1" floodColor="#0f172a" floodOpacity="0.28" />
      </filter>
      <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#3b82f6" floodOpacity="0.55" />
      </filter>
    </defs>
  );
}

function HomeIcon3D({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <path d="M4.5 11.5 12 5.5l7.5 6v9.5a1 1 0 0 1-1 1h-4.5v-5.5H10v5.5H5.5a1 1 0 0 1-1-1v-9.5Z" fill={`url(#${uid}-white)`} />
      <path d="M4.5 11.5 12 5.5l7.5 6H4.5Z" fill={`url(#${uid}-blue-top)`} />
      <path d="M8.5 14.5h7v6.5H8.5V14.5Z" fill={`url(#${uid}-glass)`} opacity="0.55" />
      <path d="M5 12.5 12 7l7 5.5" fill="none" stroke="#ffffff" strokeOpacity="0.65" strokeWidth="0.75" />
    </g>
  );
}

function SearchIcon3D({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <circle cx="10.5" cy="10.5" r="5.75" fill="none" stroke={`url(#${uid}-chrome)`} strokeWidth="2.25" />
      <circle cx="10.5" cy="10.5" r="3.25" fill={`url(#${uid}-glass)`} opacity="0.85" />
      <path d="M15.25 15.25 19.5 19.5" stroke={`url(#${uid}-chrome)`} strokeWidth="2.25" strokeLinecap="round" />
      <ellipse cx="9.25" cy="8.75" rx="1.75" ry="1.1" fill="#ffffff" opacity="0.55" transform="rotate(-18 9.25 8.75)" />
    </g>
  );
}

function SellIcon3D({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-glow)`}>
      <path
        d="M12 6.5v11M6.5 12h11"
        stroke="#ffffff"
        strokeWidth="2.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 6.5v11M6.5 12h11"
        stroke={`url(#${uid}-shine)`}
        strokeWidth="1.25"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </g>
  );
}

function SavedIcon3D({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <path
        d="M12 19.25S5.25 14.75 5.25 9.75C5.25 7.5 7 5.75 9.25 5.75c1.35 0 2.55.65 2.75 1.65.2-1 1.4-1.65 2.75-1.65 2.25 0 4 1.75 4 4 0 5-6.75 9.5-6.75 9.5Z"
        fill={`url(#${uid}-heart)`}
      />
      <path
        d="M12 19.25S5.25 14.75 5.25 9.75C5.25 7.5 7 5.75 9.25 5.75c1.35 0 2.55.65 2.75 1.65.2-1 1.4-1.65 2.75-1.65 2.25 0 4 1.75 4 4 0 5-6.75 9.5-6.75 9.5Z"
        fill="none"
        stroke={`url(#${uid}-chrome)`}
        strokeWidth="0.85"
      />
      <ellipse cx="9.5" cy="8.75" rx="2" ry="1.25" fill="#ffffff" opacity="0.35" transform="rotate(-22 9.5 8.75)" />
    </g>
  );
}

function AccountIcon3D({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <circle cx="12" cy="12" r="8.25" fill={`url(#${uid}-blue-deep)`} />
      <circle cx="12" cy="12" r="8.25" fill={`url(#${uid}-shine)`} opacity="0.35" />
      <circle cx="12" cy="9.25" r="2.75" fill={`url(#${uid}-white)`} />
      <path d="M6.75 17.25c.85-2.35 2.85-3.75 5.25-3.75s4.4 1.4 5.25 3.75" fill={`url(#${uid}-white)`} />
      <circle cx="12" cy="12" r="8.25" fill="none" stroke={`url(#${uid}-chrome)`} strokeWidth="0.75" opacity="0.65" />
    </g>
  );
}

const ICON_RENDERERS: Record<BottomNavIconType, (uid: string) => ReactElement> = {
  home: (uid) => <HomeIcon3D uid={uid} />,
  search: (uid) => <SearchIcon3D uid={uid} />,
  sell: (uid) => <SellIcon3D uid={uid} />,
  saved: (uid) => <SavedIcon3D uid={uid} />,
  account: (uid) => <AccountIcon3D uid={uid} />,
};

export function BottomNavIcon3D({ type, active = false, className }: BottomNavIcon3DProps) {
  const uid = useId().replace(/:/g, "");
  const RenderIcon = ICON_RENDERERS[type];

  return (
    <span
      className={cn(
        "bottom-nav-icon-3d",
        type === "sell" && "bottom-nav-icon-3d--sell-inner",
        active && "bottom-nav-icon-3d--active",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="bottom-nav-item-2026__icon" role="presentation">
        <IconDefs uid={uid} />
        {RenderIcon(uid)}
      </svg>
    </span>
  );
}

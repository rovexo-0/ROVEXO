"use client";

import { useId, type ReactElement } from "react";
import { cn } from "@/lib/cn";

export type BottomNavIconType = "home" | "search" | "sell" | "saved" | "account";

type BottomNavIcon3DProps = {
  type: BottomNavIconType;
  active?: boolean;
  className?: string;
  /** Tab icons render at 32px; sell stays at 24px inside the sell button. */
  size?: "tab" | "sell";
};

const TAB_ICON_PX = 32;
const SELL_ICON_PX = 34;

function IconDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-blue-top`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bfdbfe" />
        <stop offset="40%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id={`${uid}-blue-mid`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </linearGradient>
      <linearGradient id={`${uid}-blue-deep`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#172554" />
      </linearGradient>
      <linearGradient id={`${uid}-chrome`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="38%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id={`${uid}-glass`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#eff6ff" stopOpacity="0.98" />
        <stop offset="55%" stopColor="#93c5fd" stopOpacity="0.88" />
        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.72" />
      </linearGradient>
      <linearGradient id={`${uid}-heart`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fecaca" />
        <stop offset="45%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#991b1b" />
      </linearGradient>
      <linearGradient id={`${uid}-white`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
      <linearGradient id={`${uid}-shine`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
        <stop offset="45%" stopColor="#ffffff" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${uid}-rim`} x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`${uid}-ambient`} cx="35%" cy="28%" r="65%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <filter id={`${uid}-shadow`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#0f172a" floodOpacity="0.32" />
        <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#3b82f6" floodOpacity="0.28" />
      </filter>
      <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#3b82f6" floodOpacity="0.65" />
      </filter>
    </defs>
  );
}

function IconPlate({ uid }: { uid: string }) {
  return (
    <>
      <circle cx="12" cy="12.5" r="9.2" fill={`url(#${uid}-blue-deep)`} opacity="0.14" />
      <circle cx="12" cy="12" r="8.4" fill={`url(#${uid}-rim)`} opacity="0.35" />
      <ellipse cx="10.2" cy="9.4" rx="4.8" ry="3.1" fill={`url(#${uid}-ambient)`} />
    </>
  );
}

function HomeIcon3D({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <IconPlate uid={uid} />
      <path d="M4.2 11.8 12 5.2l7.8 6.6v10.2a.9.9 0 0 1-.9.9H5.1a.9.9 0 0 1-.9-.9V11.8Z" fill={`url(#${uid}-white)`} />
      <path d="M4.2 11.8 12 5.2l7.8 6.6H4.2Z" fill={`url(#${uid}-blue-top)`} />
      <path d="M4.8 12.2 12 6.4l7.2 5.8" fill="none" stroke="#ffffff" strokeOpacity="0.72" strokeWidth="0.85" />
      <path d="M8.2 14.2h7.6v7.1H8.2v-7.1Z" fill={`url(#${uid}-glass)`} opacity="0.72" />
      <path d="M8.2 14.2h7.6v7.1H8.2v-7.1Z" fill={`url(#${uid}-shine)`} opacity="0.35" />
      <rect x="10.4" y="16.2" width="3.2" height="3.8" rx="0.6" fill="#ffffff" opacity="0.45" />
    </g>
  );
}

function SearchIcon3D({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <IconPlate uid={uid} />
      <circle cx="10.6" cy="10.6" r="6.2" fill="none" stroke={`url(#${uid}-chrome)`} strokeWidth="2.4" />
      <circle cx="10.6" cy="10.6" r="6.2" fill={`url(#${uid}-shine)`} opacity="0.22" />
      <circle cx="10.6" cy="10.6" r="3.6" fill={`url(#${uid}-glass)`} />
      <ellipse cx="9.1" cy="9.1" rx="2.1" ry="1.3" fill="#ffffff" opacity="0.62" transform="rotate(-18 9.1 9.1)" />
      <path d="M15.1 15.1 19.8 19.8" stroke={`url(#${uid}-chrome)`} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M15.1 15.1 19.8 19.8" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" opacity="0.45" />
    </g>
  );
}

function SellIcon3D({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-glow)`}>
      <path d="M12 6.5v11M6.5 12h11" stroke="#ffffff" strokeWidth="2.75" strokeLinecap="round" fill="none" />
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
      <IconPlate uid={uid} />
      <path
        d="M12 19.6S4.8 14.7 4.8 9.4C4.8 7 6.7 5.1 9.1 5.1c1.5 0 2.9.75 2.9 2.05 0-1.3 1.4-2.05 2.9-2.05 2.4 0 4.3 1.9 4.3 4.3 0 5.3-7.2 10.2-7.2 10.2Z"
        fill={`url(#${uid}-heart)`}
      />
      <path
        d="M12 19.6S4.8 14.7 4.8 9.4C4.8 7 6.7 5.1 9.1 5.1c1.5 0 2.9.75 2.9 2.05 0-1.3 1.4-2.05 2.9-2.05 2.4 0 4.3 1.9 4.3 4.3 0 5.3-7.2 10.2-7.2 10.2Z"
        fill={`url(#${uid}-shine)`}
        opacity="0.28"
      />
      <path
        d="M12 19.6S4.8 14.7 4.8 9.4C4.8 7 6.7 5.1 9.1 5.1c1.5 0 2.9.75 2.9 2.05 0-1.3 1.4-2.05 2.9-2.05 2.4 0 4.3 1.9 4.3 4.3 0 5.3-7.2 10.2-7.2 10.2Z"
        fill="none"
        stroke={`url(#${uid}-chrome)`}
        strokeWidth="0.9"
      />
      <ellipse cx="9.2" cy="8.4" rx="2.3" ry="1.45" fill="#ffffff" opacity="0.42" transform="rotate(-22 9.2 8.4)" />
    </g>
  );
}

function AccountIcon3D({ uid }: { uid: string }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <IconPlate uid={uid} />
      <circle cx="12" cy="12" r="8.5" fill={`url(#${uid}-blue-mid)`} />
      <circle cx="12" cy="12" r="8.5" fill={`url(#${uid}-shine)`} opacity="0.38" />
      <circle cx="12" cy="12" r="8.5" fill="none" stroke={`url(#${uid}-chrome)`} strokeWidth="0.9" opacity="0.75" />
      <circle cx="12" cy="9.1" r="2.9" fill={`url(#${uid}-white)`} />
      <circle cx="12" cy="9.1" r="2.9" fill={`url(#${uid}-shine)`} opacity="0.35" />
      <path d="M6.4 17.4c.95-2.55 3.1-4.05 5.6-4.05s4.65 1.5 5.6 4.05" fill={`url(#${uid}-white)`} />
      <path d="M6.4 17.4c.95-2.55 3.1-4.05 5.6-4.05s4.65 1.5 5.6 4.05" fill={`url(#${uid}-shine)`} opacity="0.22" />
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

export function BottomNavIcon3D({
  type,
  active = false,
  className,
  size = "tab",
}: BottomNavIcon3DProps) {
  const uid = useId().replace(/:/g, "");
  const RenderIcon = ICON_RENDERERS[type];
  const isSell = size === "sell";
  const iconPx = isSell ? SELL_ICON_PX : TAB_ICON_PX;

  return (
    <span
      className={cn(
        "bottom-nav-icon-3d",
        isSell ? "bottom-nav-icon-3d--sell-inner" : "bottom-nav-icon-3d--tab",
        active && !isSell && "bottom-nav-icon-3d--active",
        className,
      )}
      style={{ width: iconPx, height: iconPx }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        width={iconPx}
        height={iconPx}
        style={{ width: iconPx, height: iconPx }}
        className={isSell ? "bottom-nav-item-2026__icon" : "bottom-nav-tab-icon-2026"}
        role="presentation"
      >
        <IconDefs uid={uid} />
        {RenderIcon(uid)}
      </svg>
    </span>
  );
}

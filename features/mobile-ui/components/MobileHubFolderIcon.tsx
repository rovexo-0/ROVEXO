"use client";

import { useId } from "react";
import {
  BagLineIcon,
  ChatLineIcon,
  TagLineIcon,
  UserLineIcon,
} from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";
import type { MobilePrimaryHubId } from "@/lib/mobile-ui/types";

type MobileHubFolderIconProps = {
  hub: MobilePrimaryHubId;
  className?: string;
};

const HUB_ACCENTS: Record<MobilePrimaryHubId, { from: string; to: string }> = {
  buy: { from: "#60a5fa", to: "var(--ds-color-accent)" },
  sell: { from: "#34d399", to: "#047857" },
  business: { from: "#a78bfa", to: "#5b21b6" },
  support: { from: "#fbbf24", to: "#b45309" },
};

const HUB_ICONS = {
  buy: BagLineIcon,
  sell: TagLineIcon,
  business: UserLineIcon,
  support: ChatLineIcon,
} as const;

export function MobileHubFolderIcon({ hub, className }: MobileHubFolderIconProps) {
  const uid = useId().replace(/:/g, "");
  const accent = HUB_ACCENTS[hub];
  const HubIcon = HUB_ICONS[hub];

  return (
    <span className={cn("mhub-folder-icon relative inline-flex", className)} aria-hidden>
      <svg viewBox="0 0 48 48" className="h-12 w-12" role="presentation">
        <defs>
          <linearGradient id={`${uid}-hub`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accent.from} />
            <stop offset="100%" stopColor={accent.to} />
          </linearGradient>
          <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.25" />
          </filter>
        </defs>
        <circle cx="24" cy="24" r="22" fill={`url(#${uid}-hub)`} filter={`url(#${uid}-shadow)`} />
        <circle cx="24" cy="24" r="22" fill="white" fillOpacity="0.12" />
      </svg>
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-white">
        <HubIcon className="h-[26px] w-[26px]" />
      </span>
    </span>
  );
}

"use client";

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
  const accent = HUB_ACCENTS[hub];
  const HubIcon = HUB_ICONS[hub];

  return (
    <span
      className={cn(
        "mhub-folder-icon relative inline-flex h-12 w-12 items-center justify-center rounded-full",
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}
      aria-hidden
    >
      <HubIcon className="h-[26px] w-[26px] text-white" />
    </span>
  );
}

"use client";

import { DashboardIcon3D } from "@/components/icons/DashboardIcon3D";
import { MobilePremiumBadge } from "@/features/mobile-ui/components/MobilePremiumPrimitives";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { ChevronRightIcon } from "@/features/product-detail/icons";
import type { MobilePrimaryHubId } from "@/lib/mobile-ui/types";

const HUB_ICON_MAP: Record<MobilePrimaryHubId, "buy-hub" | "sell-hub" | "business-hub" | "support-hub"> = {
  buy: "buy-hub",
  sell: "sell-hub",
  business: "business-hub",
  support: "support-hub",
};

type MobilePrimaryHubFolderProps = {
  hub: { id: MobilePrimaryHubId; label: string; subtitle: string; tiles: unknown[] };
  badgeCount: number;
  onOpen: () => void;
};

export function MobilePrimaryHubFolder({ hub, badgeCount, onOpen }: MobilePrimaryHubFolderProps) {
  const itemCount = hub.tiles.length;

  return (
    <button
      type="button"
      className={cn("dash-v1-tile", focusRing)}
      onClick={onOpen}
      aria-label={`${hub.label} hub. ${hub.subtitle}. ${itemCount} destinations${badgeCount > 0 ? `, ${badgeCount} notifications` : ""}`}
      aria-haspopup="true"
    >
      <MobilePremiumBadge count={badgeCount} />

      <div className="dash-v1-tile__top">
        <div className="dash-v1-tile__icon">
          <DashboardIcon3D type={HUB_ICON_MAP[hub.id]} size={32} />
        </div>
        <ChevronRightIcon className="dash-v1-tile__chevron h-4 w-4 shrink-0" aria-hidden />
      </div>

      <div>
        <p className="dash-v1-tile__title">{hub.label}</p>
        <p className="dash-v1-tile__subtitle">{hub.subtitle}</p>
        <p className="mt-1 text-[0.6875rem] font-medium text-text-muted">
          {itemCount} {itemCount === 1 ? "link" : "links"}
        </p>
      </div>
    </button>
  );
}

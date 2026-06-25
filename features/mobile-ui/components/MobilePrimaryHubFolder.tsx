"use client";

import { ChevronRightIcon } from "@/features/product-detail/icons";
import { MobileHubFolderIcon } from "@/features/mobile-ui/components/MobileHubFolderIcon";
import { MobilePremiumBadge } from "@/features/mobile-ui/components/MobilePremiumPrimitives";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { MobilePrimaryHub } from "@/lib/mobile-ui/types";

type MobilePrimaryHubFolderProps = {
  hub: MobilePrimaryHub;
  badgeCount: number;
  onOpen: () => void;
};

export function MobilePrimaryHubFolder({ hub, badgeCount, onOpen }: MobilePrimaryHubFolderProps) {
  const itemCount = hub.tiles.length;

  return (
    <button
      type="button"
      className={cn("mhub-card mhub-folder-card", focusRing)}
      onClick={onOpen}
      aria-label={`${hub.label} hub. ${hub.subtitle}. ${itemCount} destinations${badgeCount > 0 ? `, ${badgeCount} notifications` : ""}`}
      aria-haspopup="true"
    >
      <MobilePremiumBadge count={badgeCount} />

      <div className="mhub-card__top">
        <MobileHubFolderIcon hub={hub.id} />
        <ChevronRightIcon className="mhub-card__chevron h-4 w-4 shrink-0" aria-hidden />
      </div>

      <div>
        <p className="mhub-card__title">{hub.label}</p>
        <p className="mhub-card__subtitle">{hub.subtitle}</p>
        <p className="mt-1 text-[0.6875rem] font-medium text-text-muted">
          {itemCount} {itemCount === 1 ? "link" : "links"}
        </p>
      </div>
    </button>
  );
}

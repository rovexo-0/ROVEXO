"use client";

import Link from "next/link";
import { getTileIcon } from "@/lib/account-center/tile-icons";
import { NotificationBadge } from "@/features/account-page/components/NotificationBadge";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";
import type { MobileTile } from "@/lib/mobile-ui/types";

type AccountModuleTileGridProps = {
  tiles: MobileTile[];
  resolveBadge: (href: string, key?: MobileTile["badge"]) => number;
  variant?: "default" | "seller";
};

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m7 5 5 5-5 5" />
    </svg>
  );
}

export function AccountModuleTileGrid({
  tiles,
  resolveBadge,
  variant = "default",
}: AccountModuleTileGridProps) {
  return (
    <div className={cn("account-center-tiles", variant === "seller" && "account-center-tiles--seller")}>
      {tiles.map((tile) => {
        const badgeCount = resolveBadge(tile.href, tile.badge);
        const icon = getTileIcon(tile.href, tile.label);
        return (
          <Link
            key={`${tile.href}-${tile.label}`}
            href={tile.href}
            className={cn("account-center-tile", focusRing)}
            aria-label={`${tile.label}. ${tile.subtitle}`}
          >
            {badgeCount > 0 ? (
              <NotificationBadge count={badgeCount} className="account-center-tile__badge" />
            ) : null}
            <div
              className="account-center-tile__icon"
              style={{ backgroundColor: icon.background }}
              aria-hidden
            >
              <span className="account-center-tile__emoji">{icon.emoji}</span>
            </div>
            <p className="account-center-tile__title">{tile.label}</p>
            <p className="account-center-tile__subtitle">{tile.subtitle}</p>
            <ChevronIcon className="account-center-tile__chevron h-5 w-5" />
          </Link>
        );
      })}
    </div>
  );
}

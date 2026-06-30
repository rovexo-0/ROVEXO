"use client";

import {
  DashboardGrid,
  DashboardSection,
  DashboardTile,
} from "@/features/dashboard";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { resolveHrefBadge } from "@/lib/notifications/badge-counts";
import { resolveMobileBadge } from "@/features/mobile-ui/hooks/use-mobile-badges";
import type { MobileBadgeKey } from "@/lib/mobile-ui/types";
import { resolveDashboardIconType } from "@/components/icons/DashboardIcon3D";
import { QUICK_ACCESS_TILES } from "@/lib/dashboard/sections";

export function DashboardQuickAccess() {
  const { badgeCounts, mobileBadges: badges } = useRealtimeNotifications();

  const resolveBadge = (href: string, key?: MobileBadgeKey) =>
    badgeCounts ? resolveHrefBadge(href, badgeCounts) : resolveMobileBadge(key, badges);

  return (
    <DashboardSection id="dash-quick-access" title="Quick access">
      <DashboardGrid>
        {QUICK_ACCESS_TILES.map((tile) => (
          <DashboardTile
            key={`quick-${tile.href}`}
            href={tile.href}
            title={tile.label}
            subtitle={tile.subtitle}
            iconType={resolveDashboardIconType(tile.href)}
            badgeCount={resolveBadge(tile.href, tile.badge)}
            badgeTone="danger"
          />
        ))}
      </DashboardGrid>
    </DashboardSection>
  );
}

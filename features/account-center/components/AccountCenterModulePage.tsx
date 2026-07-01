"use client";

import { AccountCenterHeader } from "@/features/account-center/components/AccountCenterHeader";
import { AccountCenterLogoutButton } from "@/features/account-center/components/AccountCenterLogoutButton";
import { AccountCenterDeleteButton } from "@/features/account-center/components/AccountCenterDeleteButton";
import { AccountModuleTileGrid } from "@/features/account-center/components/AccountModuleTileGrid";
import {
  getModuleMeta,
  getModuleTiles,
  type AccountCenterModuleId,
} from "@/lib/account-center/modules";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { resolveHrefBadge } from "@/lib/notifications/badge-counts";
import { resolveMobileBadge } from "@/features/mobile-ui/hooks/use-mobile-badges";
import type { MobileBadgeKey } from "@/lib/mobile-ui/types";
import type { UserProfile } from "@/lib/profile/types";
import { cn } from "@/lib/cn";

type AccountCenterModulePageProps = {
  moduleId: AccountCenterModuleId;
  profile: UserProfile;
  description?: string;
  showLogout?: boolean;
};

export function AccountCenterModulePage({
  moduleId,
  profile,
  showLogout = false,
}: AccountCenterModulePageProps) {
  const meta = getModuleMeta(moduleId);
  const tiles = getModuleTiles(moduleId, profile);
  const { badgeCounts, mobileBadges } = useRealtimeNotifications();

  const resolveBadge = (href: string, key?: MobileBadgeKey) =>
    badgeCounts ? resolveHrefBadge(href, badgeCounts) : resolveMobileBadge(key, mobileBadges);

  return (
    <div className={cn("account-center", moduleId === "seller" && "account-center--seller")}>
      <div className="account-center__container">
        <AccountCenterHeader
          title={meta.title}
          showBack
          backHref={meta.backHref}
          backLabel={meta.backLabel}
          variant="module"
        />

        <AccountModuleTileGrid
          tiles={tiles}
          resolveBadge={resolveBadge}
          variant={moduleId === "seller" ? "seller" : "default"}
        />

        {showLogout ? (
          <>
            <AccountCenterLogoutButton />
            <AccountCenterDeleteButton />
          </>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { AccountCenterLogoutButton } from "@/features/account-center/components/AccountCenterLogoutButton";
import { AccountCenterDeleteButton } from "@/features/account-center/components/AccountCenterDeleteButton";
import { AccountModuleTileGrid } from "@/features/account-center/components/AccountModuleTileGrid";
import { AccountCanonicalShell } from "@/features/account-canonical";
import {
  getModuleMeta,
  getModuleTiles,
  type AccountCenterModuleId,
} from "@/lib/account-center/modules";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { resolveHrefBadge } from "@/lib/notifications/badge-counts";
import { resolveMobileBadge } from "@/features/mobile-ui/hooks/use-mobile-badges";
import type { MobileBadgeKey } from "@/lib/mobile-ui/types";
import { cn } from "@/lib/cn";

type AccountCenterModulePageProps = {
  moduleId: AccountCenterModuleId;
  description?: string;
  showLogout?: boolean;
};

export function AccountCenterModulePage({
  moduleId,
  showLogout = false,
}: AccountCenterModulePageProps) {
  const meta = getModuleMeta(moduleId);
  const tiles = getModuleTiles(moduleId);
  const { badgeCounts, mobileBadges } = useRealtimeNotifications();

  const resolveBadge = (href: string, key?: MobileBadgeKey) =>
    badgeCounts ? resolveHrefBadge(href, badgeCounts) : resolveMobileBadge(key, mobileBadges);

  return (
    <AccountCanonicalShell
      title={meta.title}
      backHref={meta.backHref}
      bottomNavTab={moduleId === "selling" ? "sell" : "account"}
    >
      <div
        className={cn(
          "account-center account-center--module px-ds-4 pb-ds-6",
          moduleId === "selling" && "account-center--seller",
        )}
        data-account-module-dashboard={moduleId}
      >
        <AccountModuleTileGrid
          tiles={tiles}
          resolveBadge={resolveBadge}
          variant={moduleId === "selling" ? "seller" : "default"}
        />

        {showLogout ? (
          <>
            <AccountCenterLogoutButton />
            <AccountCenterDeleteButton />
          </>
        ) : null}
      </div>
    </AccountCanonicalShell>
  );
}

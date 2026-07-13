import type { DashboardBadgeCounts } from "@/lib/notifications/badge-counts";
import type { MobileBadgeKey } from "@/lib/mobile-ui/types";
import { resolveHrefBadge } from "@/lib/notifications/badge-counts";
import type { AccountQuickAccessModule } from "@/lib/account-center/modules";

export function sumBadgeKeys(
  keys: MobileBadgeKey[] | undefined,
  badgeCounts: DashboardBadgeCounts | null,
  resolveMobile: (key?: MobileBadgeKey) => number,
): number {
  if (!keys?.length) return 0;
  return keys.reduce((total, key) => {
    if (badgeCounts) {
      const hrefKeys: Partial<Record<MobileBadgeKey, string>> = {
        orders: "/orders",
        cart: "/cart",
        messages: "/inbox",
        notifications: "/inbox?tab=notifications",
        saved: "/saved",
        "wallet-payout": "/seller/wallet",
      };
      const href = hrefKeys[key];
      if (href) return total + resolveHrefBadge(href, badgeCounts);
    }
    return total + resolveMobile(key);
  }, 0);
}

export function quickAccessBadgeCount(
  module: AccountQuickAccessModule,
  badgeCounts: DashboardBadgeCounts | null,
  resolveMobile: (key?: MobileBadgeKey) => number,
): number {
  return sumBadgeKeys(module.badgeKeys, badgeCounts, resolveMobile);
}

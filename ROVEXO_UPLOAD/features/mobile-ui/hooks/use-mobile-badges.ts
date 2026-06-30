"use client";

import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { resolveHrefBadge } from "@/lib/notifications/badge-counts";
import type { MobileBadgeKey, MobileBadges } from "@/lib/mobile-ui/types";

type BadgeState = {
  messages: number;
  notifications: number;
  orders: number;
  saved: number;
  cart: number;
  walletPayout: number;
};

export function useMobileBadges(initial?: Partial<BadgeState> & { isSeller?: boolean }): MobileBadges {
  const realtime = useRealtimeNotifications();

  if (realtime.badgeCounts) {
    return realtime.mobileBadges;
  }

  return {
    messages: initial?.messages ?? realtime.mobileBadges.messages,
    notifications: initial?.notifications ?? realtime.unreadCount,
    orders: initial?.orders ?? realtime.mobileBadges.orders,
    saved: initial?.saved ?? realtime.mobileBadges.saved,
    cart: initial?.cart ?? realtime.mobileBadges.cart,
    "wallet-payout": initial?.walletPayout ?? realtime.mobileBadges["wallet-payout"],
  };
}

export function resolveMobileBadge(
  key: MobileBadgeKey | undefined,
  badges: MobileBadges,
  override?: number,
): number {
  if (override != null) return override;
  if (!key) return 0;
  return badges[key] ?? 0;
}

export function resolveTileBadge(href: string, badges: MobileBadges, badgeCounts: ReturnType<typeof useRealtimeNotifications>["badgeCounts"]): number {
  if (badgeCounts) {
    return resolveHrefBadge(href, badgeCounts);
  }
  return resolveMobileBadge(undefined, badges, 0);
}

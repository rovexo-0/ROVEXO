import type { MobileBadgeKey } from "@/lib/mobile-ui/types";

export type DashboardBadgeCounts = Record<MobileBadgeKey, number> & {
  total: number;
  byHref: Record<string, number>;
};

export function resolveHrefBadge(href: string, counts: DashboardBadgeCounts): number {
  if (counts.byHref[href]) return counts.byHref[href];

  const match = Object.entries(counts.byHref).find(
    ([key]) => href === key || href.startsWith(`${key}/`),
  );
  if (match) return match[1];

  if (href.startsWith("/orders") || href === "/orders") return counts.orders;
  if (href.startsWith("/cart")) return counts.cart;
  if (href.startsWith("/saved")) return counts.saved;
  if (href.startsWith("/inbox") || href.startsWith("/messages")) return counts.messages + counts.notifications;
  if (href.startsWith("/notifications")) return counts.notifications;
  if (href.startsWith("/seller/wallet")) return counts["wallet-payout"];
  if (href.startsWith("/seller/orders")) return counts.orders;

  return 0;
}

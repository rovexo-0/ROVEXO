import { createClient } from "@/lib/supabase/server";
import type { MobileBadgeKey } from "@/lib/mobile-ui/types";
import type { DashboardBadgeCounts } from "@/lib/notifications/badge-counts";

const HREF_BADGE_KEYS: Array<{ prefix: string; key: MobileBadgeKey }> = [
  { prefix: "/orders", key: "orders" },
  { prefix: "/cart", key: "cart" },
  { prefix: "/saved", key: "saved" },
  { prefix: "/inbox", key: "messages" },
  { prefix: "/messages", key: "messages" },
  { prefix: "/notifications", key: "notifications" },
  { prefix: "/seller/wallet", key: "wallet-payout" },
  { prefix: "/seller/orders", key: "orders" },
];

function hrefCount(rows: Array<{ href: string }>, prefix: string): number {
  return rows.filter((row) => row.href === prefix || row.href.startsWith(`${prefix}/`)).length;
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  return count ?? 0;
}

export async function getNotificationBadgeCounts(userId: string): Promise<DashboardBadgeCounts> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("href, type")
    .eq("user_id", userId)
    .eq("read", false);

  const rows = data ?? [];
  const byHref: Record<string, number> = {};

  for (const row of rows) {
    byHref[row.href] = (byHref[row.href] ?? 0) + 1;
  }

  const counts: DashboardBadgeCounts = {
    total: rows.length,
    messages: rows.filter((row) => row.type === "message").length,
    notifications: rows.length,
    orders: rows.filter((row) => row.type === "order").length,
    saved: rows.filter(
      (row) =>
        row.type === "saved_search_match" ||
        row.type === "saved_item_sold" ||
        row.type === "price_reduced",
    ).length,
    cart: hrefCount(rows, "/cart"),
    "wallet-payout": rows.filter(
      (row) => row.type === "payment" || row.href.startsWith("/seller/wallet"),
    ).length,
    byHref,
  };

  for (const { prefix, key } of HREF_BADGE_KEYS) {
    const hrefMatches = hrefCount(rows, prefix);
    if (hrefMatches > counts[key]) {
      counts[key] = hrefMatches;
    }
  }

  return counts;
}

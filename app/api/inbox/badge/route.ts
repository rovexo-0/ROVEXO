import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getUnreadNotificationCount } from "@/lib/notifications/badge-counts-server";

/**
 * Lightweight Inbox badge SSOT (DEFECT #004 / #007).
 * Avoids loading full conversation/notification payloads for bottom-nav.
 */
export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const supabase = await createClient();
  const userId = auth.user.id;

  const [buyerUnread, sellerUnread, notifications] = await Promise.all([
    supabase
      .from("conversations")
      .select("buyer_unread_count")
      .eq("buyer_id", userId)
      .eq("buyer_archived", false),
    supabase
      .from("conversations")
      .select("seller_unread_count")
      .eq("seller_id", userId)
      .eq("seller_archived", false),
    getUnreadNotificationCount(userId),
  ]);

  const messages =
    (buyerUnread.data ?? []).reduce((sum, row) => sum + (row.buyer_unread_count ?? 0), 0) +
    (sellerUnread.data ?? []).reduce((sum, row) => sum + (row.seller_unread_count ?? 0), 0);

  return NextResponse.json({
    messages,
    notifications,
    inboxBadge: messages + notifications,
  });
}

import { NextResponse } from "next/server";
import { requireApiAuth, type AuthContext } from "@/lib/auth/session";
import { getUnreadNotificationCount } from "@/lib/notifications/badge-counts-server";

type ConversationClient = AuthContext["supabase"];

function readAggregateSum(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const value = row.sum ?? row.buyer_unread_count ?? row.seller_unread_count;
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function sumUnreadColumn(
  supabase: ConversationClient,
  column: "buyer_unread_count" | "seller_unread_count",
  userColumn: "buyer_id" | "seller_id",
  archivedColumn: "buyer_archived" | "seller_archived",
  userId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("conversations")
    .select(`${column}.sum()`)
    .eq(userColumn, userId)
    .eq(archivedColumn, false)
    .maybeSingle();

  const aggregated = error ? null : readAggregateSum(data);
  if (aggregated != null) return aggregated;

  const fallback = await supabase
    .from("conversations")
    .select(column)
    .eq(userColumn, userId)
    .eq(archivedColumn, false);

  return (fallback.data ?? []).reduce((sum, row) => {
    const value =
      column === "buyer_unread_count"
        ? (row as { buyer_unread_count?: number }).buyer_unread_count
        : (row as { seller_unread_count?: number }).seller_unread_count;
    return sum + Number(value ?? 0);
  }, 0);
}

/**
 * Lightweight Inbox badge SSOT (DEFECT #004 / #007).
 * Avoids loading full conversation/notification payloads for bottom-nav.
 */
export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const supabase = auth.supabase;
  const userId = auth.user.id;

  const [buyerUnread, sellerUnread, notifications] = await Promise.all([
    sumUnreadColumn(
      supabase,
      "buyer_unread_count",
      "buyer_id",
      "buyer_archived",
      userId,
    ),
    sumUnreadColumn(
      supabase,
      "seller_unread_count",
      "seller_id",
      "seller_archived",
      userId,
    ),
    getUnreadNotificationCount(userId, supabase),
  ]);

  const messages = buyerUnread + sellerUnread;

  return NextResponse.json({
    messages,
    notifications,
    inboxBadge: messages + notifications,
  });
}

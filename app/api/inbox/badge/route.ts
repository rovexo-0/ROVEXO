import { NextResponse } from "next/server";
import {
  requireCookieOrBearerApiAuth,
  withPrivateNoStore,
} from "@/lib/auth/require-cookie-or-bearer-api-auth-v1";
import type { AuthContext } from "@/lib/auth/session";
import { loadActiveSellerContext } from "@/lib/business/business-onboarding-v1";
import { resolveConversationSellerContext } from "@/lib/inbox/inbox-seller-context-scope-v1";
import { getUnreadNotificationCount } from "@/lib/notifications/badge-counts-server";
import { normalizeSellerContext } from "@/lib/seller-context/seller-context-v1";

type ConversationClient = AuthContext["supabase"];

async function sumScopedUnread(
  supabase: ConversationClient,
  userId: string,
  active: ReturnType<typeof normalizeSellerContext>,
): Promise<number> {
  const { data } = await supabase
    .from("conversations")
    .select(
      "id, product_id, buyer_id, seller_id, buyer_unread_count, seller_unread_count, buyer_archived, seller_archived",
    )
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

  const rows = data ?? [];
  const sellerRows = rows.filter((row) => row.seller_id === userId);
  const conversationIds = sellerRows.map((row) => row.id);
  const productIds = [...new Set(sellerRows.map((row) => row.product_id))];

  const checkoutContextByConversation = new Map<string, string>();
  const checkoutContextByListing = new Map<string, string>();
  if (sellerRows.length > 0) {
    const { data: sessions } = await supabase
      .from("checkout_sessions")
      .select("conversation_id, listing_id, seller_context, created_at")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });
    for (const session of sessions ?? []) {
      const conversationId = String(session.conversation_id ?? "");
      const listingId = String(session.listing_id ?? "");
      const sellerContext = String(session.seller_context ?? "individual");
      if (
        conversationId &&
        conversationIds.includes(conversationId) &&
        !checkoutContextByConversation.has(conversationId)
      ) {
        checkoutContextByConversation.set(conversationId, sellerContext);
      }
      if (listingId && productIds.includes(listingId) && !checkoutContextByListing.has(listingId)) {
        checkoutContextByListing.set(listingId, sellerContext);
      }
    }
  }

  let total = 0;
  for (const row of rows) {
    const viewerIsBuyer = row.buyer_id === userId;
    const archived = viewerIsBuyer ? row.buyer_archived : row.seller_archived;
    if (archived) continue;
    const stamped = resolveConversationSellerContext({
      viewerIsBuyer,
      orderContext: null,
      checkoutContext:
        checkoutContextByConversation.get(row.id) ??
        checkoutContextByListing.get(row.product_id) ??
        null,
    });
    if (normalizeSellerContext(stamped) !== active) continue;
    total += Number(
      viewerIsBuyer ? row.buyer_unread_count ?? 0 : row.seller_unread_count ?? 0,
    );
  }
  return total;
}

/**
 * Lightweight Inbox badge SSOT (DEFECT #004 / #007).
 * Scoped to active seller context — Individual ≠ Business unread.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireCookieOrBearerApiAuth(request);
  if (auth instanceof NextResponse) return withPrivateNoStore(auth);

  const supabase = auth.supabase;
  const userId = auth.user.id;
  const activeSellerContext = await loadActiveSellerContext(userId);

  const [messages, notifications] = await Promise.all([
    sumScopedUnread(supabase, userId, activeSellerContext),
    getUnreadNotificationCount(userId, supabase),
  ]);

  return withPrivateNoStore(
    NextResponse.json({
      messages,
      notifications,
      inboxBadge: messages + notifications,
      sellerContext: activeSellerContext,
    }),
  );
}

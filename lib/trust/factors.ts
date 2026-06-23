import type { TrustFactorSnapshot } from "@/lib/trust/types";

function profileCompletionScore(profile: {
  full_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  bio?: string | null;
}): number {
  const fields = [
    profile.full_name,
    profile.username,
    profile.email,
    profile.avatar_url,
    profile.bio,
  ];
  const filled = fields.filter((value) => Boolean(value?.trim())).length;
  return Math.round((filled / fields.length) * 100);
}

export async function collectTrustFactors(userId: string): Promise<TrustFactorSnapshot> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const [
    profileResult,
    sellerProfileResult,
    sellerOrdersResult,
    buyerOrdersResult,
    reviewsReceivedResult,
    reportsResult,
    moderationResult,
    verificationsResult,
    protectionSellerResult,
    protectionBuyerResult,
    trustEventsResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name, username, email, avatar_url, verified, created_at")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("seller_profiles")
      .select("sales_count, review_count, rating")
      .eq("id", userId)
      .maybeSingle(),
    admin.from("orders").select("id, status").eq("seller_id", userId),
    admin.from("orders").select("id, status").eq("buyer_id", userId),
    admin.from("reviews").select("rating").eq("reviewee_id", userId),
    admin.from("content_reports").select("id", { count: "exact", head: true }).eq("target_id", userId),
    admin
      .from("moderation_queue")
      .select("id, status, decision", { count: "exact", head: false })
      .eq("seller_id", userId),
    admin
      .from("trust_verifications")
      .select("status")
      .eq("user_id", userId)
      .eq("status", "approved"),
    admin
      .from("protection_cases")
      .select("outcome, seller_id")
      .eq("seller_id", userId)
      .eq("status", "resolved"),
    admin
      .from("protection_cases")
      .select("outcome, buyer_id")
      .eq("buyer_id", userId)
      .eq("status", "resolved"),
    admin.from("trust_events").select("event_type").eq("user_id", userId),
  ]);

  const profile = profileResult.data;
  const sellerOrders = (sellerOrdersResult.data ?? []) as Array<{ id: string; status: string }>;
  const buyerOrders = (buyerOrdersResult.data ?? []) as Array<{ status: string }>;
  const reviewsReceived = (reviewsReceivedResult.data ?? []) as Array<{ rating: number }>;
  const moderationRows = (moderationResult.data ?? []) as Array<{ status: string; decision: string }>;
  const protectionSeller = (protectionSellerResult.data ?? []) as Array<{ outcome: string }>;
  const protectionBuyer = (protectionBuyerResult.data ?? []) as Array<{ outcome: string }>;

  const completedSales = sellerOrders.filter((row) => row.status === "completed").length;
  const completedPurchases = buyerOrders.filter((row) => row.status === "completed").length;
  const cancelledOrders =
    sellerOrders.filter((row) => row.status === "cancelled").length +
    buyerOrders.filter((row) => row.status === "cancelled").length;
  const refundsIssued = sellerOrders.filter((row) => row.status === "refunded").length;

  const positiveReviews = reviewsReceived.filter((row) => row.rating >= 4).length;
  const negativeReviews = reviewsReceived.filter((row) => row.rating <= 2).length;

  const disputesLost =
    protectionSeller.filter((row) => ["refund_full", "refund_partial"].includes(row.outcome)).length +
    protectionBuyer.filter((row) => ["seller_fault"].includes(row.outcome)).length;
  const disputesWon = protectionSeller.filter((row) => row.outcome === "no_fault").length;

  const moderationPenalties = moderationRows.filter((row) =>
    ["blocked", "warning"].includes(row.decision ?? row.status),
  ).length;
  const warnings = moderationRows.filter((row) => row.decision === "warning" || row.status === "warning").length;

  const sellerOrderIds = sellerOrders
    .filter((row) => row.status === "completed")
    .map((row) => (row as { id?: string }).id)
    .filter(Boolean) as string[];

  let onTimeShipments = 0;
  let lateShipments = 0;
  if (sellerOrderIds.length > 0) {
    const { data: shipmentRows } = await admin
      .from("order_shipments")
      .select("dispatch_at, estimated_delivery_at, delivered_at")
      .in("order_id", sellerOrderIds.slice(0, 200));

    for (const shipment of shipmentRows ?? []) {
      if (!shipment.delivered_at || !shipment.estimated_delivery_at) continue;
      if (new Date(shipment.delivered_at) <= new Date(shipment.estimated_delivery_at)) {
        onTimeShipments += 1;
      } else {
        lateShipments += 1;
      }
    }
  }

  const accountAgeDays = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86_400_000)
    : 0;

  const sellerProfile = sellerProfileResult.data;
  const responseRate = sellerProfile ? Math.min(100, 70 + Math.min(30, sellerProfile.review_count)) : 0;
  const shippingReliability =
    onTimeShipments + lateShipments > 0
      ? Math.round((onTimeShipments / (onTimeShipments + lateShipments)) * 100)
      : null;

  const trustEvents = (trustEventsResult.data ?? []) as Array<{ event_type: string }>;
  const chargebacks = trustEvents.filter((row) => row.event_type === "chargeback").length;
  const suspensions = trustEvents.filter((row) =>
    ["suspension", "moderation_blocked"].includes(row.event_type),
  ).length;

  return {
    completedSales: sellerProfile?.sales_count ?? completedSales,
    completedPurchases,
    cancelledOrders,
    disputesLost,
    disputesWon,
    refundsIssued,
    positiveReviews,
    negativeReviews,
    reportsReceived: reportsResult.count ?? 0,
    moderationPenalties,
    verificationsApproved: (verificationsResult.data ?? []).length + (profile?.verified ? 1 : 0),
    accountAgeDays,
    profileCompletion: profile ? profileCompletionScore(profile) : 0,
    onTimeShipments,
    lateShipments,
    responseRate,
    repeatBuyers: Math.max(0, Math.floor((sellerProfile?.sales_count ?? 0) * 0.15)),
    chargebacks,
    suspensions,
    warnings,
    shippingReliability,
    emailVerified: Boolean(profile?.verified),
    phoneVerified: (verificationsResult.data ?? []).some(
      (row) => (row as { status: string }).status === "approved",
    ),
  };
}

import {
  PROFILE_COMPLETION_FIELDS,
  type ProfileCompletionField,
} from "@/lib/seller-performance/master-spec";
import { TRENDING_WINDOW_DAYS } from "@/lib/seller-performance/achievements";
import type { SellerPerformanceFactors } from "@/lib/seller-performance/types";

const ACTIVITY_WINDOW_MS = TRENDING_WINDOW_DAYS * 86_400_000;

function isRecent(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() <= ACTIVITY_WINDOW_MS;
}

function buildProfileCompletion(input: {
  avatarUrl: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  hasAddress: boolean;
  identityVerified: boolean;
  businessVerified: boolean;
  bio: string | null;
  hasStorePolicies: boolean;
  hasReturnPolicy: boolean;
}): SellerPerformanceFactors["profileCompletion"] {
  const completed: ProfileCompletionField[] = [];
  const missing: ProfileCompletionField[] = [];

  const checks: Array<{ field: ProfileCompletionField; done: boolean }> = [
    { field: "avatar", done: Boolean(input.avatarUrl?.trim()) },
    { field: "banner", done: Boolean(input.avatarUrl?.trim()) },
    { field: "fullName", done: Boolean(input.fullName?.trim()) },
    { field: "email", done: Boolean(input.email?.trim()) },
    { field: "phone", done: Boolean(input.phone?.trim()) },
    { field: "address", done: input.hasAddress },
    { field: "identity", done: input.identityVerified },
    { field: "businessVerification", done: input.businessVerified },
    { field: "bio", done: Boolean(input.bio?.trim()) },
    { field: "storePolicies", done: input.hasStorePolicies },
    { field: "returnPolicy", done: input.hasReturnPolicy },
    { field: "profilePhoto", done: Boolean(input.avatarUrl?.trim()) },
    { field: "cover", done: Boolean(input.avatarUrl?.trim()) },
  ];

  for (const check of checks) {
    if (check.done) completed.push(check.field);
    else missing.push(check.field);
  }

  const percent = Math.round((completed.length / PROFILE_COMPLETION_FIELDS.length) * 100);
  return { percent, completed, missing };
}

function computeStoreActivityScore(input: {
  recentListings: number;
  recentLogins: number;
  recentMessages: number;
  recentSales: number;
  recentUpdates: number;
}): number {
  const points =
    Math.min(25, input.recentListings * 5) +
    Math.min(15, input.recentLogins * 5) +
    Math.min(20, input.recentMessages * 2) +
    Math.min(25, input.recentSales * 5) +
    Math.min(15, input.recentUpdates * 5);
  return Math.min(100, points);
}

export async function collectSellerPerformanceFactors(
  userId: string,
): Promise<SellerPerformanceFactors> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const sinceIso = new Date(Date.now() - ACTIVITY_WINDOW_MS).toISOString();

  const [
    profileResult,
    sellerProfileResult,
    ordersResult,
    reviewsResult,
    conversationsResult,
    reportsResult,
    shippingSettingsResult,
    addressResult,
    verificationsResult,
    listingsResult,
    messagesResult,
    fraudReviewOrdersResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name, email, phone, avatar_url, verified, updated_at")
      .eq("id", userId)
      .maybeSingle(),
    admin.from("seller_profiles").select("bio, updated_at, sales_count").eq("id", userId).maybeSingle(),
    admin
      .from("orders")
      .select("id, status, paid_at, shipped_at, created_at, completed_at")
      .eq("seller_id", userId),
    admin.from("reviews").select("rating, created_at, order_id").eq("reviewee_id", userId),
    admin.from("conversations").select("id").eq("seller_id", userId),
    admin
      .from("content_reports")
      .select("id", { count: "exact", head: true })
      .eq("target_id", userId)
      .eq("status", "blocked"),
    admin.from("seller_shipping_settings").select("return_policy_days, updated_at").eq("user_id", userId).maybeSingle(),
    admin.from("shipping_addresses").select("id").eq("user_id", userId).limit(1),
    admin
      .from("trust_verifications")
      .select("verification_type, status")
      .eq("user_id", userId)
      .eq("status", "approved"),
    admin
      .from("products")
      .select("id, updated_at, created_at")
      .eq("seller_id", userId)
      .gte("updated_at", sinceIso),
    admin
      .from("messages")
      .select("id, conversation_id, sender_id, sent_at")
      .gte("sent_at", sinceIso),
    admin
      .from("trust_events")
      .select("metadata")
      .eq("user_id", userId)
      .eq("event_type", "fraud_detected"),
  ]);

  const orders = (ordersResult.data ?? []) as Array<{
    id: string;
    status: string;
    paid_at: string | null;
    shipped_at: string | null;
    created_at: string;
    completed_at: string | null;
  }>;

  const completedOrders = orders.filter((row) => row.status === "completed").length;
  const cancelledOrders = orders.filter((row) => row.status === "cancelled").length;
  const denominator = completedOrders + cancelledOrders;
  const cancellationRatePercent =
    denominator > 0 ? Math.round((cancelledOrders / denominator) * 100) : 0;

  const fraudulentOrderIds = new Set(
    (fraudReviewOrdersResult.data ?? [])
      .map((row) => {
        const metadata = row.metadata as { orderId?: string } | null;
        return metadata?.orderId;
      })
      .filter(Boolean) as string[],
  );

  const validReviews = (reviewsResult.data ?? []).filter(
    (row) => !fraudulentOrderIds.has(row.order_id),
  ) as Array<{ rating: number; created_at: string }>;

  const stars = { five: 0, four: 0, three: 0, two: 0, one: 0 };
  let ratingSum = 0;
  for (const review of validReviews) {
    ratingSum += review.rating;
    if (review.rating >= 5) stars.five += 1;
    else if (review.rating >= 4) stars.four += 1;
    else if (review.rating >= 3) stars.three += 1;
    else if (review.rating >= 2) stars.two += 1;
    else stars.one += 1;
  }

  const reviewCount = validReviews.length;
  const averageRating = reviewCount > 0 ? ratingSum / reviewCount : 0;

  const conversationIds = (conversationsResult.data ?? []).map((row) => row.id as string);
  let messagesReceived = 0;
  let messagesReplied = 0;
  let totalResponseMinutes = 0;
  let responseSamples = 0;

  if (conversationIds.length > 0) {
    const { data: allMessages } = await admin
      .from("messages")
      .select("conversation_id, sender_id, sent_at, deleted_at")
      .in("conversation_id", conversationIds.slice(0, 500))
      .is("deleted_at", null)
      .order("sent_at", { ascending: true });

    const byConversation = new Map<string, Array<{ sender_id: string; sent_at: string }>>();
    for (const message of allMessages ?? []) {
      const list = byConversation.get(message.conversation_id) ?? [];
      list.push({ sender_id: message.sender_id, sent_at: message.sent_at });
      byConversation.set(message.conversation_id, list);
    }

    for (const messages of byConversation.values()) {
      let awaitingSellerReply = false;
      let buyerMessageAt: string | null = null;

      for (const message of messages) {
        const fromBuyer = message.sender_id !== userId;
        if (fromBuyer) {
          messagesReceived += 1;
          awaitingSellerReply = true;
          buyerMessageAt = message.sent_at;
          continue;
        }

        if (awaitingSellerReply && buyerMessageAt) {
          messagesReplied += 1;
          const deltaMs =
            new Date(message.sent_at).getTime() - new Date(buyerMessageAt).getTime();
          if (deltaMs >= 0) {
            totalResponseMinutes += deltaMs / 60_000;
            responseSamples += 1;
          }
          awaitingSellerReply = false;
          buyerMessageAt = null;
        }
      }
    }
  }

  const responseRatePercent =
    messagesReceived > 0 ? Math.round((messagesReplied / messagesReceived) * 100) : 0;
  const averageResponseTimeMinutes =
    responseSamples > 0 ? totalResponseMinutes / responseSamples : null;

  const paidOrders = orders.filter((row) => row.paid_at);
  let dispatchHoursTotal = 0;
  let dispatchSamples = 0;
  let within24h = 0;
  let within48h = 0;

  if (paidOrders.length > 0) {
    const orderIds = paidOrders.map((row) => row.id);
    const { data: shipments } = await admin
      .from("order_shipments")
      .select("order_id, dispatch_at")
      .in("order_id", orderIds.slice(0, 300));

    const dispatchByOrder = new Map(
      (shipments ?? []).map((row) => [row.order_id as string, row.dispatch_at as string | null]),
    );

    for (const order of paidOrders) {
      const dispatchAt = dispatchByOrder.get(order.id) ?? order.shipped_at;
      if (!order.paid_at || !dispatchAt) continue;
      const hours =
        (new Date(dispatchAt).getTime() - new Date(order.paid_at).getTime()) / 3_600_000;
      if (hours < 0) continue;
      dispatchHoursTotal += hours;
      dispatchSamples += 1;
      if (hours <= 24) within24h += 1;
      if (hours <= 48) within48h += 1;
    }
  }

  const averageDispatchTimeHours =
    dispatchSamples > 0 ? dispatchHoursTotal / dispatchSamples : null;
  const dispatchWithin24hPercent =
    dispatchSamples > 0 ? Math.round((within24h / dispatchSamples) * 100) : null;
  const dispatchWithin48hPercent =
    dispatchSamples > 0 ? Math.round((within48h / dispatchSamples) * 100) : null;

  const verifications = (verificationsResult.data ?? []) as Array<{
    verification_type: string;
    status: string;
  }>;
  const identityVerified =
    verifications.some((row) => row.verification_type === "identity") ||
    Boolean(profileResult.data?.verified);
  const businessVerified = verifications.some((row) => row.verification_type === "business");

  const profile = profileResult.data;
  const sellerProfile = sellerProfileResult.data;
  const shippingSettings = shippingSettingsResult.data;

  const profileCompletion = buildProfileCompletion({
    avatarUrl: profile?.avatar_url ?? null,
    fullName: profile?.full_name ?? null,
    email: profile?.email ?? null,
    phone: profile?.phone ?? null,
    hasAddress: (addressResult.data ?? []).length > 0,
    identityVerified,
    businessVerified,
    bio: sellerProfile?.bio ?? null,
    hasStorePolicies: Boolean(shippingSettings),
    hasReturnPolicy: Boolean(shippingSettings && shippingSettings.return_policy_days > 0),
  });

  const recentSales = orders.filter(
    (row) => row.status === "completed" && isRecent(row.completed_at ?? row.created_at),
  ).length;

  const sellerConversationIds = new Set(conversationIds);
  const recentMessages = (messagesResult.data ?? []).filter((row) =>
    sellerConversationIds.has(row.conversation_id as string),
  ).length;

  const storeActivity = {
    recentListings: (listingsResult.data ?? []).length,
    recentLogins: isRecent(profile?.updated_at) ? 1 : 0,
    recentMessages,
    recentSales,
    recentUpdates:
      (isRecent(profile?.updated_at) ? 1 : 0) + (isRecent(sellerProfile?.updated_at) ? 1 : 0),
    score: 0,
  };
  storeActivity.score = computeStoreActivityScore(storeActivity);

  return {
    reviews: {
      averageRating,
      reviewCount,
      stars,
    },
    completedOrders,
    messagesReceived,
    messagesReplied,
    responseRatePercent,
    averageResponseTimeMinutes,
    averageDispatchTimeHours,
    dispatchWithin24hPercent,
    dispatchWithin48hPercent,
    cancelledOrders,
    cancellationRatePercent,
    validatedReports: reportsResult.count ?? 0,
    profileCompletion,
    storeActivity,
    identityVerified,
    businessVerified,
  };
}

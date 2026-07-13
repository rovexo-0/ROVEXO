import { createAdminClient } from "@/lib/supabase/admin";
import type { RecalculationTrigger } from "@/lib/seller-performance/master-spec";
import { detectOrderTrustFraud, detectReviewFraud } from "@/lib/trust/anti-fraud";

export type SellerPerformanceFraudResult = {
  flagged: boolean;
  reasons: string[];
};

export async function detectSellerPerformanceFraud(input: {
  userId: string;
  trigger: RecalculationTrigger;
  metadata?: Record<string, unknown>;
}): Promise<SellerPerformanceFraudResult> {
  const reasons: string[] = [];
  const admin = createAdminClient();
  const sinceHour = new Date(Date.now() - 3_600_000).toISOString();
  const sinceDay = new Date(Date.now() - 86_400_000).toISOString();
  const sinceWeek = new Date(Date.now() - 7 * 86_400_000).toISOString();

  if (input.trigger === "review") {
    const orderId = String(input.metadata?.orderId ?? "");
    const reviewerId = String(input.metadata?.reviewerId ?? "");
    if (orderId && reviewerId) {
      const fraud = await detectReviewFraud({
        orderId,
        reviewerId,
        revieweeId: input.userId,
      });
      if (fraud.blocked) reasons.push(fraud.reason ?? "suspicious_review");
    }

    const { count: reviewBurst } = await admin
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("reviewee_id", input.userId)
      .gte("created_at", sinceHour);
    if ((reviewBurst ?? 0) >= 6) reasons.push("review_burst");
  }

  if (input.trigger === "completed_order") {
    const buyerId = String(input.metadata?.buyerId ?? "");
    const sellerId = input.userId;
    if (buyerId) {
      const fraud = await detectOrderTrustFraud({ buyerId, sellerId });
      if (fraud.blocked) reasons.push(fraud.reason ?? "self_purchase");

      const { count: repeatBuyer } = await admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", sellerId)
        .eq("buyer_id", buyerId)
        .eq("status", "completed")
        .gte("completed_at", sinceDay);
      if ((repeatBuyer ?? 0) >= 4) reasons.push("repeat_buyer_pattern");
    }
  }

  if (input.trigger === "cancellation") {
    const { count: cancelBurst } = await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", input.userId)
      .eq("status", "cancelled")
      .gte("cancelled_at", sinceDay);
    if ((cancelBurst ?? 0) >= 4) reasons.push("rapid_cancellation");
  }

  if (input.trigger === "validated_report") {
    const { count: reportBurst } = await admin
      .from("content_reports")
      .select("id", { count: "exact", head: true })
      .eq("target_id", input.userId)
      .eq("status", "blocked")
      .gte("created_at", sinceWeek);
    if ((reportBurst ?? 0) >= 4) reasons.push("repeated_reports");
  }

  return { flagged: reasons.length > 0, reasons };
}

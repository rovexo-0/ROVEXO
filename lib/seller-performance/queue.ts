import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types/database";
import { detectSellerPerformanceFraud } from "@/lib/seller-performance/anti-fraud";
import { invalidateSellerPerformanceCache } from "@/lib/seller-performance/cache";
import type { RecalculationTrigger } from "@/lib/seller-performance/master-spec";
import { recalculateSellerPerformanceInternal } from "@/lib/seller-performance/service";

export type QueueSellerPerformanceEventInput = {
  userId: string;
  trigger: RecalculationTrigger;
  metadata?: Record<string, unknown>;
  reason?: string;
  idempotencyKey: string;
};

export async function enqueueSellerPerformanceEvent(
  input: QueueSellerPerformanceEventInput,
): Promise<{ queued: boolean; flagged: boolean }> {
  const admin = createAdminClient();
  const fraud = await detectSellerPerformanceFraud({
    userId: input.userId,
    trigger: input.trigger,
    metadata: input.metadata,
  });

  const status = fraud.flagged ? "flagged" : "pending";

  const { error } = await admin.from("seller_performance_event_queue").insert({
    user_id: input.userId,
    event_type: input.trigger,
    idempotency_key: input.idempotencyKey,
    metadata: (input.metadata ?? {}) as Json,
    status,
    fraud_flags: fraud.reasons as unknown as Json,
  });

  if (error) {
    if (error.code === "23505") {
      return { queued: false, flagged: false };
    }
    throw error;
  }

  if (!fraud.flagged) {
    await processSellerPerformanceQueue(input.userId);
  }

  return { queued: true, flagged: fraud.flagged };
}

export async function processSellerPerformanceQueue(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: pendingRows } = await admin
    .from("seller_performance_event_queue")
    .select("id, event_type, metadata, created_at")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  if (!pendingRows?.length) return;

  const ids = pendingRows.map((row) => row.id as string);
  await admin
    .from("seller_performance_event_queue")
    .update({ status: "processing" })
    .in("id", ids);

  const latest = pendingRows[pendingRows.length - 1]!;
  try {
    await recalculateSellerPerformanceInternal({
      userId,
      trigger: latest.event_type as RecalculationTrigger,
      metadata: (latest.metadata as Record<string, unknown>) ?? {},
    });
    invalidateSellerPerformanceCache(userId);

    await admin
      .from("seller_performance_event_queue")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
      })
      .in("id", ids);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Queue processing failed";
    await admin
      .from("seller_performance_event_queue")
      .update({
        status: "failed",
        error_message: message,
        processed_at: new Date().toISOString(),
      })
      .in("id", ids);
    throw error;
  }
}

import { createAdminClient } from "@/lib/supabase/admin";
import { retryPushDelivery } from "@/lib/push/service";

export type PushRetryResult = {
  processed: number;
  succeeded: number;
  failed: number;
};

export async function processPushDeliveryRetries(limit = 50): Promise<PushRetryResult> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: pending } = await admin
    .from("notification_delivery_log")
    .select("id")
    .eq("channel", "push")
    .eq("status", "failed")
    .not("next_retry_at", "is", null)
    .lte("next_retry_at", now)
    .lt("retry_count", 5)
    .order("next_retry_at", { ascending: true })
    .limit(limit);

  const result: PushRetryResult = { processed: 0, succeeded: 0, failed: 0 };

  for (const row of pending ?? []) {
    result.processed += 1;
    const ok = await retryPushDelivery(row.id);
    if (ok) {
      result.succeeded += 1;
    } else {
      result.failed += 1;
    }
  }

  return result;
}

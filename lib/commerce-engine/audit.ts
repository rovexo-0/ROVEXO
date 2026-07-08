import { createCommerceAdminClient } from "@/lib/commerce-engine/db-client";
import type { CommerceAuditInput, CommerceAuditRow } from "@/lib/commerce-engine/types";

/**
 * Audit Engine — records an immutable financial audit entry.
 *
 * Best-effort: auditing must NEVER break a money-movement flow. Failures are
 * swallowed (the caller's financial operation is the source of truth), but the
 * intent is that every financial action is logged.
 */
export async function recordCommerceAudit(input: CommerceAuditInput): Promise<void> {
  try {
    const admin = createCommerceAdminClient();
    const { error } = await admin.from("commerce_audit_logs").insert({
      event: input.event,
      order_id: input.orderId ?? null,
      user_id: input.userId ?? null,
      actor_id: input.actorId ?? null,
      engine: input.engine ?? "commerce",
      rule: input.rule ?? null,
      result: input.result ?? null,
      amount: input.amount ?? null,
      currency: input.currency ?? "GBP",
      correlation_id: input.correlationId ?? null,
      metadata: input.metadata ?? {},
    });
    if (error) {
      console.error("[commerce-engine] audit insert failed", { event: input.event, error: error.message });
    }
  } catch (error) {
    console.error("[commerce-engine] audit insert threw", {
      event: input.event,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Reads the audit trail for an order (most recent first). */
export async function listOrderAudit(orderId: string, limit = 100): Promise<CommerceAuditRow[]> {
  try {
    const admin = createCommerceAdminClient();
    const { data, error } = await admin
      .from("commerce_audit_logs")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data as CommerceAuditRow[]) ?? [];
  } catch {
    return [];
  }
}

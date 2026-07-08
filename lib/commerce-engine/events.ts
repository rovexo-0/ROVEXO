/**
 * Commerce Engine — canonical financial event stream (Phase 2 + 3).
 *
 * Every lifecycle event is recorded on the immutable audit ledger
 * (commerce_audit_logs). This is the single, append-only event log for the
 * escrow/settlement overlay; it never moves money by itself.
 */

import { recordCommerceAudit } from "@/lib/commerce-engine/audit";

/** Canonical Commerce Engine events (spec — final financial engine). */
export type CommerceEvent =
  | "PAYMENT_CAPTURED"
  | "ESCROW_OPENED"
  | "PLATFORM_FEE_RESERVED"
  | "SHIPPING_RESERVED"
  | "LABEL_CREATED"
  | "TRACKING_UPDATED"
  | "DELIVERED"
  | "AUTO_RELEASE"
  | "SELLER_AVAILABLE"
  | "SELLER_PAID"
  | "REFUND_STARTED"
  | "REFUND_COMPLETED";

export const COMMERCE_EVENTS: readonly CommerceEvent[] = [
  "PAYMENT_CAPTURED",
  "ESCROW_OPENED",
  "PLATFORM_FEE_RESERVED",
  "SHIPPING_RESERVED",
  "LABEL_CREATED",
  "TRACKING_UPDATED",
  "DELIVERED",
  "AUTO_RELEASE",
  "SELLER_AVAILABLE",
  "SELLER_PAID",
  "REFUND_STARTED",
  "REFUND_COMPLETED",
] as const;

export type EmitCommerceEventInput = {
  event: CommerceEvent;
  orderId?: string | null;
  userId?: string | null;
  actorId?: string | null;
  amount?: number | null;
  rule?: string | null;
  result?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Emit a Commerce Engine event onto the immutable audit ledger.
 * Best-effort: emitting an event must never break a money-movement flow.
 */
export async function emitCommerceEvent(input: EmitCommerceEventInput): Promise<void> {
  await recordCommerceAudit({
    event: input.event,
    orderId: input.orderId ?? null,
    userId: input.userId ?? null,
    actorId: input.actorId ?? null,
    engine: "commerce.events",
    rule: input.rule ?? null,
    result: input.result ?? "ok",
    amount: input.amount ?? null,
    correlationId: input.correlationId ?? null,
    metadata: input.metadata ?? {},
  });
}

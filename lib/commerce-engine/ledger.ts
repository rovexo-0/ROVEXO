import { createCommerceAdminClient } from "@/lib/commerce-engine/db-client";
import { recordCommerceAudit } from "@/lib/commerce-engine/audit";
import type {
  CommerceAuditRow,
  EscrowEventInput,
  EscrowEventRow,
  OrderCommerceLedger,
  RefundEventInput,
  RefundEventRow,
  ShippingReserveRow,
  ShippingTransactionRow,
} from "@/lib/commerce-engine/types";

/**
 * Append an immutable escrow event. Service-role only (Commerce Engine authority).
 * Returns the created row id, or null on failure.
 */
export async function recordEscrowEvent(input: EscrowEventInput): Promise<string | null> {
  try {
    const admin = createCommerceAdminClient();
    const { data, error } = await admin
      .from("escrow_events")
      .insert({
        order_id: input.orderId,
        seller_id: input.sellerId,
        event_type: input.eventType,
        from_state: input.fromState ?? null,
        to_state: input.toState ?? null,
        amount: input.amount ?? 0,
        currency: input.currency ?? "GBP",
        reason: input.reason ?? null,
        correlation_id: input.correlationId ?? null,
        metadata: input.metadata ?? {},
      })
      .select("id")
      .single();
    if (error) {
      console.error("[commerce-engine] escrow event failed", error.message);
      return null;
    }
    const row = data as { id: string } | null;
    return row?.id ?? null;
  } catch (error) {
    console.error("[commerce-engine] escrow event threw", error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Append an immutable refund event. Service-role only (Commerce Engine authority).
 */
export async function recordRefundEvent(input: RefundEventInput): Promise<string | null> {
  try {
    const admin = createCommerceAdminClient();
    const { data, error } = await admin
      .from("refund_events")
      .insert({
        order_id: input.orderId,
        buyer_id: input.buyerId ?? null,
        seller_id: input.sellerId ?? null,
        refund_type: input.refundType,
        amount: input.amount,
        currency: input.currency ?? "GBP",
        status: input.status ?? "pending",
        stripe_refund_id: input.stripeRefundId ?? null,
        reason: input.reason ?? null,
        correlation_id: input.correlationId ?? null,
        metadata: input.metadata ?? {},
      })
      .select("id")
      .single();
    if (error) {
      console.error("[commerce-engine] refund event failed", error.message);
      return null;
    }
    const row = data as { id: string } | null;
    return row?.id ?? null;
  } catch (error) {
    console.error("[commerce-engine] refund event threw", error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function listEscrowEvents(orderId: string): Promise<EscrowEventRow[]> {
  const admin = createCommerceAdminClient();
  const { data } = await admin
    .from("escrow_events")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  return (data as EscrowEventRow[]) ?? [];
}

async function listRefundEvents(orderId: string): Promise<RefundEventRow[]> {
  const admin = createCommerceAdminClient();
  const { data } = await admin
    .from("refund_events")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  return (data as RefundEventRow[]) ?? [];
}

async function getShippingReserve(orderId: string): Promise<ShippingReserveRow | null> {
  const admin = createCommerceAdminClient();
  const { data } = await admin.from("shipping_reserve").select("*").eq("order_id", orderId).maybeSingle();
  return (data as ShippingReserveRow | null) ?? null;
}

async function listShippingTransactions(orderId: string): Promise<ShippingTransactionRow[]> {
  const admin = createCommerceAdminClient();
  const { data } = await admin
    .from("shipping_transactions")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  return (data as ShippingTransactionRow[]) ?? [];
}

async function listAudit(orderId: string): Promise<CommerceAuditRow[]> {
  const admin = createCommerceAdminClient();
  const { data } = await admin
    .from("commerce_audit_logs")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  return (data as CommerceAuditRow[]) ?? [];
}

/** Aggregated financial ledger for a single order (read model for dashboards/admin). */
export async function getOrderLedger(orderId: string): Promise<OrderCommerceLedger> {
  try {
    const [escrowEvents, refundEvents, shippingReserve, shippingTransactions, auditLogs] = await Promise.all([
      listEscrowEvents(orderId),
      listRefundEvents(orderId),
      getShippingReserve(orderId),
      listShippingTransactions(orderId),
      listAudit(orderId),
    ]);
    return { orderId, escrowEvents, refundEvents, shippingReserve, shippingTransactions, auditLogs };
  } catch {
    return {
      orderId,
      escrowEvents: [],
      refundEvents: [],
      shippingReserve: null,
      shippingTransactions: [],
      auditLogs: [],
    };
  }
}

export { recordCommerceAudit };

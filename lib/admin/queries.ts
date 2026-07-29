import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/platform-analytics/events";
import type { OrderStatus } from "@/lib/orders/types";

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  buyerName: string;
  sellerName: string;
  total: number;
  createdAt: string;
};

export type AdminStats = {
  totalOrders: number;
  awaitingPayment: number;
  awaitingShipment: number;
  completed: number;
};

export type AdminOrderStatusUpdateResult = {
  ok: false;
  error: string;
  code: "RVX_ADMIN_STATUS_FORBIDDEN";
};

/**
 * Platform Integration P0 — Admin status fail-closed.
 * Raw status writes bypass payment / escrow / commerce lifecycle and are FORBIDDEN.
 * Canonical transitions remain Orders / Checkout / Shipping / Wallet engines.
 */
export async function adminUpdateOrderStatus(
  orderId: string,
  status: OrderStatus,
  actorId?: string | null,
): Promise<AdminOrderStatusUpdateResult> {
  await writeAuditLog({
    actorId: actorId ?? null,
    action: "admin.order_status_mutation_rejected",
    resourceType: "order",
    resourceId: orderId,
    metadata: {
      attemptedStatus: status,
      reason: "raw_status_mutation_forbidden",
      policy: "PLATFORM_INTEGRATION_P0_FAIL_CLOSED",
    },
  });

  return {
    ok: false,
    error:
      "Direct order status mutation is forbidden. Order lifecycle must proceed through canonical commerce engines.",
    code: "RVX_ADMIN_STATUS_FORBIDDEN",
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  const admin = createAdminClient();
  const { data } = await admin.from("orders").select("status");

  const rows = data ?? [];
  return {
    totalOrders: rows.length,
    awaitingPayment: rows.filter((row) => row.status === "awaiting_payment").length,
    awaitingShipment: rows.filter((row) => row.status === "awaiting_shipment").length,
    completed: rows.filter((row) => row.status === "completed").length,
  };
}

export async function listAdminOrders(limit = 50): Promise<AdminOrderRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      total,
      created_at,
      buyer:profiles!orders_buyer_id_fkey ( full_name ),
      seller:profiles!orders_seller_id_fkey ( full_name )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const buyer = row.buyer as { full_name: string } | null;
    const seller = row.seller as { full_name: string } | null;
    return {
      id: row.id,
      orderNumber: row.order_number,
      status: row.status as OrderStatus,
      buyerName: buyer?.full_name ?? "Buyer",
      sellerName: seller?.full_name ?? "Seller",
      total: Number(row.total),
      createdAt: row.created_at,
    };
  });
}

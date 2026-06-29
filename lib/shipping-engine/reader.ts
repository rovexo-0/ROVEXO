import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderShipment } from "@/lib/shipping/service";
import { readLiveShippingEngineDocument } from "@/lib/shipping-engine/engine";
import { SHIPPING_ENGINE_MODULES } from "@/lib/shipping-engine/registry";
import { buildShippingTimeline } from "@/lib/shipping-engine/timeline";
import type { ShippingEngineOrderContext, ShippingEngineSnapshot } from "@/lib/shipping-engine/types";
import { getShippingEngineSnapshotForAdmin } from "@/lib/shipping-engine/engine";
import type { OrderStatus } from "@/lib/orders/types";

export async function getPublicShippingEngineConfig() {
  return readLiveShippingEngineDocument();
}

export async function getShippingEngineSnapshot(): Promise<ShippingEngineSnapshot> {
  const { draft, live, history } = await getShippingEngineSnapshotForAdmin();
  return {
    scannedAt: new Date().toISOString(),
    modules: SHIPPING_ENGINE_MODULES,
    draft,
    live,
    history,
  };
}

export async function getShippingOrderContext(orderId: string): Promise<ShippingEngineOrderContext | null> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, status, delivery_carrier, tracking_number, created_at, paid_at, shipped_at, delivered_at, completed_at, protected_fee")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const shipment = await getOrderShipment(orderId);
  const config = await readLiveShippingEngineDocument();

  const timeline = buildShippingTimeline({
    orderStatus: order.status as OrderStatus,
    shipmentStatus: shipment?.status ?? null,
    createdAt: order.created_at,
    paidAt: order.paid_at ?? undefined,
    shippedAt: order.shipped_at ?? undefined,
    deliveredAt: order.delivered_at ?? undefined,
    completedAt: order.completed_at ?? undefined,
  });

  const fundsProtected =
    config.buyerProtection.fundsProtectedUntilDeliveryConfirmed &&
    !["completed", "cancelled"].includes(order.status);

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    status: order.status,
    carrier: order.delivery_carrier ?? shipment?.carrier,
    trackingNumber: order.tracking_number ?? shipment?.trackingNumber ?? undefined,
    timeline,
    buyerProtectionActive: Boolean(order.protected_fee) && config.buyerProtection.enabled,
    fundsProtected,
  };
}

export async function listUserShippingOrders(userId: string, limit = 10) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("id, order_number, status, delivery_carrier, tracking_number, created_at, shipped_at, delivered_at")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .in("status", ["awaiting_shipment", "shipped", "delivered", "issue_open", "completed"])
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

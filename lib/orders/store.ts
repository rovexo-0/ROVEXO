import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrderStripeRefund } from "@/lib/stripe/refunds";
import { cancelPendingOrder } from "@/lib/orders/checkout";
import { notifyOrderDelivered, notifyOrderShipped, notifyOrderRefunded } from "@/lib/orders/notifications";
import { releaseProductInventory } from "@/lib/inventory/service";
import type { DeliveryCarrier } from "@/lib/products/types";
import { refundSellerForOrder } from "@/lib/wallet/sales";
import { createProtectionCase } from "@/lib/protection/service";
import type {
  AddTrackingInput,
  CreateOrderInput,
  Order,
  OrderAction,
} from "@/lib/orders/types";
import type { Tables } from "@/lib/supabase/types/database";

type ProfileSnippet = { id: string; full_name: string };

type OrderRow = Tables<"orders"> & {
  order_items: Tables<"order_items">[];
  buyer: ProfileSnippet;
  seller: ProfileSnippet;
};

const ORDER_SELECT = `
  *,
  order_items (*),
  buyer:profiles!orders_buyer_id_fkey ( id, full_name ),
  seller:profiles!orders_seller_id_fkey ( id, full_name )
`;

async function fetchOrderRows(): Promise<OrderRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  return (data as OrderRow[] | null) ?? [];
}

function mapOrderRow(row: OrderRow): Order {
  const item = row.order_items[0];

  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status as Order["status"],
    product: {
      id: item?.product_id ?? row.id,
      slug: item?.slug ?? "",
      title: item?.title ?? "",
      price: Number(item?.price ?? row.item_price),
      imageUrl: item?.image_url ?? "",
      condition: item?.condition ?? "",
    },
    buyer: { id: row.buyer.id, name: row.buyer.full_name },
    seller: { id: row.seller.id, name: row.seller.full_name },
    totals: {
      itemPrice: Number(row.item_price),
      protectedFee: Number(row.protected_fee),
      delivery: Number(row.delivery_fee),
      total: Number(row.total),
    },
    deliveryCarrier: row.delivery_carrier as DeliveryCarrier,
    trackingNumber: row.tracking_number ?? undefined,
    createdAt: row.created_at,
    paidAt: row.paid_at ?? undefined,
    shippedAt: row.shipped_at ?? undefined,
    deliveredAt: row.delivered_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    disputesDisabled: row.disputes_disabled,
  };
}

export async function listOrders(): Promise<Order[]> {
  const rows = await fetchOrderRows();
  return rows.map(mapOrderRow);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return mapOrderRow(data as OrderRow);
}

export async function createOrder(
  input: CreateOrderInput,
  buyerId: string,
): Promise<Order | null> {
  const { createOrderCheckoutSession } = await import("@/lib/orders/checkout");
  const result = await createOrderCheckoutSession({
    buyerId,
    productSlug: input.productSlug,
    deliveryOption: input.deliveryCarrier === "DPD" ? "express" : "standard",
  });

  if ("error" in result) {
    return null;
  }

  return getOrderById(result.orderId);
}

export async function applyOrderAction(
  id: string,
  action: OrderAction,
  payload?: AddTrackingInput,
): Promise<Order | null> {
  const supabase = await createClient();
  const existing = await getOrderById(id);
  if (!existing) {
    return null;
  }

  if (action === "add_tracking") {
    const trackingNumber = payload?.trackingNumber?.trim();
    if (!trackingNumber || existing.status !== "awaiting_shipment") {
      return existing;
    }

    await supabase
      .from("orders")
      .update({
        status: "shipped",
        tracking_number: trackingNumber,
        shipped_at: new Date().toISOString(),
      })
      .eq("id", id);

    const admin = createAdminClient();
    const { data: buyerProfile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", existing.buyer.id)
      .maybeSingle();

    await notifyOrderShipped({
      buyerId: existing.buyer.id,
      buyerEmail: buyerProfile?.email ?? "",
      orderNumber: existing.orderNumber,
      trackingNumber,
    });

    return getOrderById(id);
  }

  if (action === "mark_delivered") {
    if (existing.status !== "shipped") {
      return existing;
    }

    await supabase
      .from("orders")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", id);

    const admin = createAdminClient();
    const { data: buyerProfile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", existing.buyer.id)
      .maybeSingle();

    await notifyOrderDelivered({
      buyerId: existing.buyer.id,
      buyerEmail: buyerProfile?.email ?? "",
      orderNumber: existing.orderNumber,
    });

    return getOrderById(id);
  }

  if (action === "cancel") {
    if (existing.status !== "awaiting_payment") {
      return existing;
    }

    await cancelPendingOrder(id, "Cancelled by user.");
    return getOrderById(id);
  }

  if (action === "refund") {
    if (!["awaiting_shipment", "shipped", "delivered", "completed"].includes(existing.status)) {
      return existing;
    }

    const admin = createAdminClient();
    const { data: orderRow } = await admin
      .from("orders")
      .select("order_items(product_id, quantity), stripe_refund_id, total")
      .eq("id", id)
      .maybeSingle();

    if (orderRow?.stripe_refund_id) {
      return getOrderById(id);
    }

    const refundResult = await createOrderStripeRefund(id);
    if ("error" in refundResult) {
      return existing;
    }

    const item = (orderRow?.order_items as Array<{ product_id: string | null; quantity: number }> | null)?.[0];
    if (item?.product_id) {
      await releaseProductInventory(item.product_id, item.quantity ?? 1);
    }

    await refundSellerForOrder(id, existing.seller.id);

    const [{ data: buyerProfile }, { data: sellerProfile }] = await Promise.all([
      admin.from("profiles").select("email").eq("id", existing.buyer.id).maybeSingle(),
      admin.from("profiles").select("email").eq("id", existing.seller.id).maybeSingle(),
    ]);

    await notifyOrderRefunded({
      buyerId: existing.buyer.id,
      buyerEmail: buyerProfile?.email ?? "",
      sellerId: existing.seller.id,
      sellerEmail: sellerProfile?.email ?? "",
      orderNumber: existing.orderNumber,
      amount: Number(orderRow?.total ?? existing.totals.total),
    });

    await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
    return getOrderById(id);
  }

  if (action === "confirm_ok") {
    if (existing.status !== "delivered" || existing.disputesDisabled) {
      return existing;
    }

    await supabase
      .from("orders")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        disputes_disabled: true,
      })
      .eq("id", id);

    return getOrderById(id);
  }

  if (action === "report_issue") {
    if (existing.status !== "delivered" || existing.disputesDisabled) {
      return existing;
    }

    await supabase.from("orders").update({ status: "issue_open" }).eq("id", id);

    await createProtectionCase({
      orderId: id,
      buyerId: existing.buyer.id,
      caseType: "dispute",
      reason: "buyer_reported_issue",
      description: `Buyer reported an issue on order ${existing.orderNumber}.`,
    });

    return getOrderById(id);
  }

  return existing;
}

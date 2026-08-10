import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/lib/orders/types";

export type ShippingOrderAccess =
  | {
      ok: true;
      role: "buyer" | "seller";
      orderId: string;
      buyerId: string;
      sellerId: string;
      status: OrderStatus;
    }
  | { ok: false };

/**
 * Platform Integration P0 — Shipping ownership gate.
 * Admin clients may load shipping rows only AFTER participant validation.
 * Non-participants fail closed (treated as not found).
 *
 * Use for quotes / shipping context reads that both parties may need.
 * Shipping *label documents* (pdfUrl) require {@link assertOrderShippingSeller}.
 */
export async function assertOrderShippingParticipant(
  orderId: string,
  userId: string,
): Promise<ShippingOrderAccess> {
  const trimmedOrderId = orderId?.trim();
  const trimmedUserId = userId?.trim();
  if (!trimmedOrderId || !trimmedUserId) {
    return { ok: false };
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, buyer_id, seller_id, status")
    .eq("id", trimmedOrderId)
    .maybeSingle();

  if (!order?.id || !order.buyer_id || !order.seller_id) {
    return { ok: false };
  }

  if (order.buyer_id === trimmedUserId) {
    return {
      ok: true,
      role: "buyer",
      orderId: order.id,
      buyerId: order.buyer_id,
      sellerId: order.seller_id,
      status: order.status as OrderStatus,
    };
  }

  if (order.seller_id === trimmedUserId) {
    return {
      ok: true,
      role: "seller",
      orderId: order.id,
      buyerId: order.buyer_id,
      sellerId: order.seller_id,
      status: order.status as OrderStatus,
    };
  }

  return { ok: false };
}

export type ShippingSellerAccess =
  | {
      ok: true;
      role: "seller";
      orderId: string;
      buyerId: string;
      sellerId: string;
      status: OrderStatus;
    }
  | { ok: false };

/**
 * Shipping Label document gate — SELLER ONLY.
 * Authenticated user must equal order.seller_id.
 * Buyers, other sellers, and anonymous callers fail closed as not found (404).
 * Does not invent admin privileges.
 */
export async function assertOrderShippingSeller(
  orderId: string,
  userId: string,
): Promise<ShippingSellerAccess> {
  const access = await assertOrderShippingParticipant(orderId, userId);
  if (!access.ok) {
    return { ok: false };
  }
  if (access.role !== "seller") {
    return { ok: false };
  }
  return {
    ok: true,
    role: "seller",
    orderId: access.orderId,
    buyerId: access.buyerId,
    sellerId: access.sellerId,
    status: access.status,
  };
}

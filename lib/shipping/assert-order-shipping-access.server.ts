import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/lib/orders/types";
import {
  findShippingRecordByTrackingNumber,
  getShippingRecord,
} from "@/lib/shipping/store";
import type { ShippingRecord } from "@/lib/shipping/types";

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

export type SendcloudTrackingRefreshAccess =
  | {
      ok: true;
      role: "buyer" | "seller";
      orderId: string;
      /** Canonical tracking number from ROVEXO shipping records — never trust raw client casing alone. */
      trackingNumber: string;
    }
  | { ok: false };

function normalizeTrackingNumber(value: string): string {
  return value.trim().toUpperCase();
}

function trackingCandidatesFromRecord(record: ShippingRecord): string[] {
  const values = [
    record.trackingNumber,
    record.label?.trackingNumber ?? null,
    ...record.parcels.map((parcel) => parcel.trackingNumber),
  ];
  return values
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
}

function resolveCanonicalTracking(
  record: ShippingRecord,
  requestedTrackingNumber: string,
): string | null {
  const needle = normalizeTrackingNumber(requestedTrackingNumber);
  for (const candidate of trackingCandidatesFromRecord(record)) {
    if (normalizeTrackingNumber(candidate) === needle) {
      return candidate;
    }
  }
  return null;
}

async function resolveOrderTrackingFromOrdersTable(
  orderId: string,
  requestedTrackingNumber: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, tracking_number")
    .eq("id", orderId)
    .maybeSingle();

  const stored = typeof order?.tracking_number === "string" ? order.tracking_number.trim() : "";
  if (!stored) return null;
  if (normalizeTrackingNumber(stored) !== normalizeTrackingNumber(requestedTrackingNumber)) {
    return null;
  }
  return stored;
}

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

/**
 * Sendcloud tracking refresh gate — buyer OR seller of the order that owns the tracking number.
 * Fail closed: no Sendcloud call and no status mutation until ownership is proven from DB.
 *
 * - With orderId: participant check, then tracking must belong to that order.
 * - Without orderId: resolve tracking → ROVEXO shipping record → participant check.
 * Never performs a global Sendcloud lookup for arbitrary tracking numbers.
 */
export async function assertSendcloudTrackingRefreshAccess(input: {
  userId: string;
  orderId?: string | null;
  trackingNumber: string;
}): Promise<SendcloudTrackingRefreshAccess> {
  const userId = input.userId?.trim();
  const trackingNumber = input.trackingNumber?.trim();
  if (!userId || !trackingNumber) {
    return { ok: false };
  }

  const orderIdParam = input.orderId?.trim() || null;

  if (orderIdParam) {
    const access = await assertOrderShippingParticipant(orderIdParam, userId);
    if (!access.ok) {
      return { ok: false };
    }

    const record = await getShippingRecord(access.orderId);
    const fromRecord = record ? resolveCanonicalTracking(record, trackingNumber) : null;
    const fromOrder =
      fromRecord ?? (await resolveOrderTrackingFromOrdersTable(access.orderId, trackingNumber));
    if (!fromOrder) {
      return { ok: false };
    }

    return {
      ok: true,
      role: access.role,
      orderId: access.orderId,
      trackingNumber: fromOrder,
    };
  }

  const record = await findShippingRecordByTrackingNumber(trackingNumber);
  if (!record?.orderId) {
    return { ok: false };
  }

  const access = await assertOrderShippingParticipant(record.orderId, userId);
  if (!access.ok) {
    return { ok: false };
  }

  const canonical = resolveCanonicalTracking(record, trackingNumber);
  if (!canonical) {
    return { ok: false };
  }

  return {
    ok: true,
    role: access.role,
    orderId: access.orderId,
    trackingNumber: canonical,
  };
}

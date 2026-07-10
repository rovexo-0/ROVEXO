import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderShippingLabel } from "@/lib/shipping/server";
import { getSellerShippingSettings } from "@/lib/seller/shipping-settings";
import { getShippingRecord } from "@/lib/shipping/store";
import { getShipmentParcelById, createShipmentParcel } from "@/lib/shipping/parcels-repository";
import type { ShippingAddress } from "@/lib/shipping/types";

/**
 * Canonical label generation — provider-agnostic entry point.
 * Routes through ShippingEngine (Sendcloud).
 */
export async function generateShippingLabelForOrder(
  orderId: string,
  sellerId: string,
  parcelId?: string,
) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, seller_id, shipping_address_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.seller_id !== sellerId) {
    return { ok: false as const, error: "Order not found or access denied." };
  }

  const record = await getShippingRecord(orderId);
  const quoteId = record?.pricing?.selectedQuoteId ?? record?.pricing?.quotes[0]?.id;
  if (!quoteId) {
    return { ok: false as const, error: "No shipping quote available for this order." };
  }

  let parcel = parcelId ? await getShipmentParcelById(parcelId) : null;
  if (!parcel) {
    parcel = await createShipmentParcel({ orderId, productItemIds: [] });
  }
  if (!parcel) {
    return { ok: false as const, error: "Unable to prepare shipment parcel." };
  }

  if (parcel.label?.status === "ready" && parcel.trackingNumber) {
    return {
      ok: true as const,
      label: parcel.label,
      record,
      parcel,
      idempotent: true as const,
    };
  }

  const collectionAddress = record?.collectionAddress;
  const deliveryAddress =
    record?.deliveryAddress ?? (await resolveOrderDeliveryAddress(order.shipping_address_id));
  if (!collectionAddress || !deliveryAddress) {
    return { ok: false as const, error: "Shipping addresses are incomplete for label generation." };
  }

  const sellerSettings = await getSellerShippingSettings(sellerId);

  const labelRecord = await generateOrderShippingLabel(orderId, {
    quoteId,
    orderId,
    orderNumber: order.order_number,
    parcelTier: record?.parcelTier ?? "small_parcel",
    collectionAddress,
    deliveryAddress,
    parcelId: parcel.id,
    parcelNumber: parcel.parcelNumber,
    labelSize: sellerSettings.defaultLabelSize,
    idempotencyKey: `rovexo-order-${orderId}-parcel-${parcel.parcelNumber}`,
  });

  const updatedParcel = await getShipmentParcelById(parcel.id);

  return {
    ok: true as const,
    label: updatedParcel?.label ?? labelRecord?.label ?? null,
    record: labelRecord,
    parcel: updatedParcel,
    idempotent: false as const,
  };
}

async function resolveOrderDeliveryAddress(
  shippingAddressId: string | null,
): Promise<ShippingAddress | null> {
  if (!shippingAddressId) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("shipping_addresses")
    .select("recipient_name, address_line, address_line_2, city, postcode, country")
    .eq("id", shippingAddressId)
    .maybeSingle();

  if (!data?.address_line || !data.postcode) return null;

  return {
    role: "delivery",
    fullName: data.recipient_name?.trim() || "Buyer",
    line1: data.address_line,
    line2: data.address_line_2 ?? undefined,
    city: data.city?.trim() || data.postcode.split(/\s+/)[0] || "United Kingdom",
    postcode: data.postcode,
    country: data.country?.trim() || "United Kingdom",
    phone: undefined,
    validated: true,
  };
}

/** @deprecated Use generateShippingLabelForOrder */
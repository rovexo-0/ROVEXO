import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderShippingLabel } from "@/lib/shipping/server";
import { getSellerShippingSettings } from "@/lib/seller/shipping-settings";
import { getShippingRecord, saveShippingQuotes } from "@/lib/shipping/store";
import { getShipmentParcelById, createShipmentParcel } from "@/lib/shipping/parcels-repository";
import { mustUseDemoShipping } from "@/lib/full-demo/security";
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
    .select("id, order_number, seller_id, shipping_address_id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.seller_id !== sellerId) {
    return { ok: false as const, error: "Order not found or access denied." };
  }

  if (order.status === "cancelled") {
    return { ok: false as const, error: "Cancelled orders cannot generate labels." };
  }

  let record = await getShippingRecord(orderId);
  let quoteId = record?.pricing?.selectedQuoteId ?? record?.pricing?.quotes[0]?.id;

  // Full Demo / sandbox / Playwright: materialize demo quotes if checkout never attached any.
  const shouldSeedDemoQuotes =
    mustUseDemoShipping() || process.env.PLAYWRIGHT_E2E === "1" || process.env.E2E_TEST === "1";

  if (!quoteId && shouldSeedDemoQuotes) {
    const { demoShippingAdapter } = await import("@/lib/shipping/pricing/demo-adapter");
    const demoCollection: ShippingAddress = record?.collectionAddress ?? {
      role: "collection",
      fullName: "ROVEXO Demo Seller",
      line1: "1 Demo Street",
      city: "London",
      postcode: "E1 6AN",
      country: "GB",
      validated: true,
    };
    const demoDelivery: ShippingAddress = record?.deliveryAddress ?? {
      role: "delivery",
      fullName: "ROVEXO Demo Buyer",
      line1: "2 Demo Road",
      city: "Manchester",
      postcode: "M1 1AE",
      country: "GB",
      validated: true,
    };
    // Call demo adapter directly — avoids router/env misconfig during E2E.
    const demoResponse = await demoShippingAdapter.getQuotes({
      parcelTier: record?.parcelTier ?? "small_parcel",
      collectionAddress: demoCollection,
      deliveryAddress: demoDelivery,
    });
    if (demoResponse.available && demoResponse.quotes.length > 0) {
      const demoPricing = {
        quotes: demoResponse.quotes,
        selectedQuoteId: demoResponse.quotes[0]!.id,
        currency: "GBP" as const,
        providerAvailable: true,
      };
      await saveShippingQuotes({ orderId, pricing: demoPricing });
      record = await getShippingRecord(orderId);
      quoteId =
        record?.pricing?.selectedQuoteId ??
        record?.pricing?.quotes[0]?.id ??
        demoPricing.selectedQuoteId ??
        demoResponse.quotes[0]!.id;
    }
  }

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

  const collectionAddress =
    record?.collectionAddress ??
    (mustUseDemoShipping()
      ? ({
          role: "collection",
          fullName: "ROVEXO Demo Seller",
          line1: "1 Demo Street",
          city: "London",
          postcode: "E1 6AN",
          country: "GB",
          validated: true,
        } satisfies ShippingAddress)
      : null);
  const deliveryAddress =
    record?.deliveryAddress ??
    (await resolveOrderDeliveryAddress(order.shipping_address_id)) ??
    (mustUseDemoShipping()
      ? ({
          role: "delivery",
          fullName: "ROVEXO Demo Buyer",
          line1: "2 Demo Road",
          city: "Manchester",
          postcode: "M1 1AE",
          country: "GB",
          validated: true,
        } satisfies ShippingAddress)
      : null);
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
  const trackingNumber =
    updatedParcel?.trackingNumber ?? labelRecord?.trackingNumber ?? null;

  if (!trackingNumber) {
    return {
      ok: false as const,
      error: "Label generation completed without a tracking number.",
    };
  }

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
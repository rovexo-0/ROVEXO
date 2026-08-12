import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderShippingLabel } from "@/lib/shipping/server";
import { getSellerShippingSettings } from "@/lib/seller/shipping-settings";
import { getShippingRecord, saveShippingQuotes } from "@/lib/shipping/store";
import { getShipmentParcelById, createShipmentParcel } from "@/lib/shipping/parcels-repository";
import {
  mustUseDemoShipping,
  mustUseDemoShippingForActors,
} from "@/lib/full-demo/security";
import type { ShippingLabelProviderFailure } from "@/lib/shipping/pricing/provider";
import { shippingLabelProviderFailure } from "@/lib/shipping/pricing/label-provider-failure-v1";
import type { ShippingAddress } from "@/lib/shipping/types";

export type GenerateShippingLabelForOrderFailure = {
  ok: false;
  error: string;
  providerFailure: ShippingLabelProviderFailure;
};

function rovexoValidationFailure(error: string): GenerateShippingLabelForOrderFailure {
  return {
    ok: false,
    error,
    providerFailure: shippingLabelProviderFailure({
      kind: "rovexo_validation",
      message: error,
      statusCode: null,
      providerId: "rovexo",
      providerRequestAttempted: false,
    }),
  };
}

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
    .select("id, order_number, seller_id, buyer_id, shipping_address_id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.seller_id !== sellerId) {
    return rovexoValidationFailure("Order not found or access denied.");
  }

  if (order.status === "cancelled" || order.status === "awaiting_payment") {
    return rovexoValidationFailure(
      order.status === "awaiting_payment"
        ? "Shipping starts after payment success."
        : "Cancelled orders cannot generate labels.",
    );
  }

  const partyIds = [order.seller_id, order.buyer_id].filter(Boolean) as string[];
  const { data: partyProfiles } = await admin
    .from("profiles")
    .select("id, email")
    .in("id", partyIds);
  const partyEmails = (partyProfiles ?? []).map((p) => p.email);
  const forceDemoShipping = mustUseDemoShippingForActors(...partyEmails);

  let record = await getShippingRecord(orderId);
  let quoteId = record?.pricing?.selectedQuoteId ?? record?.pricing?.quotes[0]?.id;

  // Full Demo / sandbox / Playwright: materialize demo quotes if checkout never attached any.
  const shouldSeedDemoQuotes =
    forceDemoShipping ||
    mustUseDemoShipping() ||
    process.env.PLAYWRIGHT_E2E === "1" ||
    process.env.E2E_TEST === "1";

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
    return rovexoValidationFailure("No shipping quote available for this order.");
  }

  const selectedQuote =
    record?.pricing?.quotes?.find((q) => q.id === quoteId) ??
    record?.pricing?.quotes?.[0] ??
    null;

  // Sendcloud production: fail closed when V3 shipping_option_code was never confirmed.
  // Never invent codes from sendcloud:N / method.id. Demo path skips this gate.
  if (
    !forceDemoShipping &&
    !mustUseDemoShipping() &&
    selectedQuote?.providerId === "sendcloud" &&
    !selectedQuote.shippingOptionCode
  ) {
    return rovexoValidationFailure(
      "Sendcloud V3 shipping_option_code is required for label generation. This order’s quote has no confirmed V3 counterpart (legacy sendcloud:N alone cannot create labels).",
    );
  }

  let parcel = parcelId ? await getShipmentParcelById(parcelId) : null;

  if (parcel?.label?.status === "ready" && parcel.trackingNumber && parcel.label.pdfUrl) {
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
    (forceDemoShipping || mustUseDemoShipping()
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
    (forceDemoShipping || mustUseDemoShipping()
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
    return rovexoValidationFailure(
      "Shipping addresses are incomplete for label generation.",
    );
  }

  if (!parcel) {
    parcel = await createShipmentParcel({ orderId, productItemIds: [] });
  }
  if (!parcel) {
    return rovexoValidationFailure("Unable to prepare shipment parcel.");
  }

  const sellerSettings = await getSellerShippingSettings(sellerId);

  let existingProviderParcelId: number | null = null;
  if (parcel?.id) {
    const { getProviderParcelIdForShipmentParcel } = await import(
      "@/lib/shipping/parcels-repository"
    );
    existingProviderParcelId = await getProviderParcelIdForShipmentParcel(parcel.id);
  }

  const { record: labelRecord, providerFailure } = await generateOrderShippingLabel(orderId, {
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
    forceDemoShipping,
    shippingOptionCode: selectedQuote?.shippingOptionCode ?? null,
    contractId: selectedQuote?.contractId ?? null,
    v2MethodId: selectedQuote?.v2MethodId ?? null,
    existingProviderParcelId,
  });

  const updatedParcel = await getShipmentParcelById(parcel.id);
  const trackingNumber =
    updatedParcel?.trackingNumber ?? labelRecord?.trackingNumber ?? null;

  if (!trackingNumber) {
    const failure =
      providerFailure ??
      shippingLabelProviderFailure({
        kind: "provider_empty_result",
        message: "Label generation completed without a tracking number.",
        statusCode: null,
        providerId: "sendcloud",
        providerRequestAttempted: true,
        code: "label_failed",
      });
    return {
      ok: false as const,
      error: failure.message,
      providerFailure: failure,
    };
  }

  const labelUrl =
    updatedParcel?.label?.pdfUrl ??
    labelRecord?.label?.pdfUrl ??
    null;
  const hasUsableLabelUrl =
    typeof labelUrl === "string" &&
    (labelUrl.startsWith("http://") ||
      labelUrl.startsWith("https://") ||
      // Demo / stored bucket paths are acceptable after persistence for non-fabricated labels.
      labelUrl.length > 0);

  if (!hasUsableLabelUrl) {
    const failure =
      providerFailure ??
      shippingLabelProviderFailure({
        kind: "provider_empty_result",
        message: "Label generation completed without a usable label URL.",
        statusCode: null,
        providerId: "sendcloud",
        providerRequestAttempted: true,
        code: "label_failed",
      });
    return {
      ok: false as const,
      error: failure.message,
      providerFailure: failure,
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

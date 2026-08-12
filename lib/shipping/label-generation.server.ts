import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderShippingLabel } from "@/lib/shipping/server";
import { getSellerShippingSettings } from "@/lib/seller/shipping-settings";
import { getShippingRecord, saveShippingQuotes } from "@/lib/shipping/store";
import {
  getShipmentParcelById,
  createShipmentParcel,
  listShipmentParcelsForOrder,
} from "@/lib/shipping/parcels-repository";
import {
  PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL,
  resolveCompleteParcelMeasurements,
} from "@/lib/shipping/parcels";
import { resolveShipmentParcelForLabel } from "@/lib/shipping/resolve-shipment-parcel-for-label-v1";
import { resolveSelectedShippingQuoteForLabel } from "@/lib/shipping/selected-shipping-quote-contract-v1";
import {
  mustUseDemoShipping,
  mustUseDemoShippingForActors,
} from "@/lib/full-demo/security";
import type { ShippingLabelProviderFailure } from "@/lib/shipping/pricing/provider";
import { shippingLabelProviderFailure } from "@/lib/shipping/pricing/label-provider-failure-v1";
import type { ShippingAddress, ShipmentParcel } from "@/lib/shipping/types";

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
    .select(
      "id, order_number, seller_id, buyer_id, shipping_address_id, status, selected_shipping_quote_id",
    )
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
    .select("id, email, phone")
    .in("id", partyIds);
  const partyEmails = (partyProfiles ?? []).map((p) => p.email);
  const profileById = new Map(
    (partyProfiles ?? []).map((p) => [
      p.id,
      {
        email: typeof p.email === "string" ? p.email.trim() : "",
        phone: typeof p.phone === "string" ? p.phone.trim() : "",
      },
    ]),
  );
  const sellerContact = profileById.get(order.seller_id) ?? { email: "", phone: "" };
  const buyerContact = order.buyer_id
    ? profileById.get(order.buyer_id) ?? { email: "", phone: "" }
    : { email: "", phone: "" };
  const forceDemoShipping = mustUseDemoShippingForActors(...partyEmails);

  let record = await getShippingRecord(orderId);
  // P8.5: production selection is persisted identity only — never quotes[0].
  const orderSelectedQuoteId =
    typeof order.selected_shipping_quote_id === "string"
      ? order.selected_shipping_quote_id.trim()
      : "";
  let quoteId =
    record?.pricing?.selectedQuoteId?.trim() ||
    orderSelectedQuoteId ||
    null;

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
        demoPricing.selectedQuoteId ??
        demoResponse.quotes[0]!.id;
    }
  }

  if (!quoteId) {
    return rovexoValidationFailure("No shipping quote selected for this order.");
  }

  // P8.5: resolve selected identity (row UUID ↔ externalQuoteId) — never quotes[0].
  const selectedQuote = resolveSelectedShippingQuoteForLabel(
    record?.pricing?.quotes,
    quoteId,
  );
  if (!selectedQuote?.id) {
    return rovexoValidationFailure(
      "Selected shipping quote could not be resolved for this order.",
    );
  }
  // Always announce with the hydrated external quote id (sendcloud:N), never a row UUID.
  quoteId = selectedQuote.id;

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

  if (!record?.id) {
    return rovexoValidationFailure("Shipping record not found.");
  }

  // P7.25: reuse Auto Single Parcel (parcels[0]) when parcelId omitted — never spawn extras.
  // Explicit parcelId: ownership-checked; never create a substitute on miss/mismatch.
  const explicitParcelId = parcelId?.trim() || null;
  const loadedExplicitParcel = explicitParcelId
    ? await getShipmentParcelById(explicitParcelId)
    : null;
  const orderParcels = explicitParcelId
    ? ([] as ShipmentParcel[])
    : await listShipmentParcelsForOrder(orderId);

  const parcelResolution = resolveShipmentParcelForLabel({
    shippingRecordId: record.id,
    explicitParcelId,
    loadedExplicitParcel,
    orderParcels,
  });

  if (parcelResolution.status === "reject") {
    return rovexoValidationFailure(parcelResolution.error);
  }

  let parcel: ShipmentParcel | null =
    parcelResolution.status === "use" ? parcelResolution.parcel : null;

  if (parcelResolution.status === "create") {
    parcel = await createShipmentParcel({ orderId, productItemIds: [] });
  }

  if (!parcel) {
    return rovexoValidationFailure("Unable to prepare shipment parcel.");
  }

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

  // Enrich contact fields for carrier announce (does not change postcode/line1/city).
  // InPost GB announcement requires recipient UK mobile; email helps carrier notify.
  const collectionAddressForLabel: ShippingAddress = {
    ...collectionAddress,
    phone: collectionAddress.phone?.trim() || sellerContact.phone || undefined,
    email: collectionAddress.email?.trim() || sellerContact.email || undefined,
  };
  const deliveryAddressForLabel: ShippingAddress = {
    ...deliveryAddress,
    phone: deliveryAddress.phone?.trim() || buyerContact.phone || undefined,
    email: deliveryAddress.email?.trim() || buyerContact.email || undefined,
  };

  // P7.21: production Sendcloud announce requires real shipment_parcels measurements.
  // Never silently substitute parcel-tier maximum envelopes (e.g. medium → 5kg / 61×46×46).
  // Missing measurements → fail closed on this parcel (do not create another).
  // Full Demo may omit measurements (demo adapter never calls Sendcloud).
  const allowDemoWithoutMeasurements = forceDemoShipping || mustUseDemoShipping();
  const parcelMeasurements = resolveCompleteParcelMeasurements({
    weightKg: parcel.weightKg,
    dimensions: parcel.dimensions,
  });
  if (!allowDemoWithoutMeasurements && !parcelMeasurements) {
    return rovexoValidationFailure(PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL);
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
    collectionAddress: collectionAddressForLabel,
    deliveryAddress: deliveryAddressForLabel,
    parcelId: parcel.id,
    parcelNumber: parcel.parcelNumber,
    ...(parcelMeasurements
      ? {
          weightKg: parcelMeasurements.weightKg,
          lengthCm: parcelMeasurements.lengthCm,
          widthCm: parcelMeasurements.widthCm,
          heightCm: parcelMeasurements.heightCm,
        }
      : {}),
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

  let existingProviderAfterSave: number | null = null;
  if (parcel?.id) {
    const { getProviderParcelIdForShipmentParcel } = await import(
      "@/lib/shipping/parcels-repository"
    );
    existingProviderAfterSave = await getProviderParcelIdForShipmentParcel(parcel.id);
  }

  // P8.6: successful announce persists provider parcel id even when tracking is async.
  const announcePersisted =
    existingProviderAfterSave != null && existingProviderAfterSave > 0;

  if (!trackingNumber && !announcePersisted) {
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

  // Tracking present but label URL missing:
  // - with announcePersisted → SUCCESS pending (label/PDF may arrive via webhook)
  // - without announcePersisted → fail closed (no provider identity to recover)
  if (trackingNumber && !hasUsableLabelUrl && !announcePersisted) {
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

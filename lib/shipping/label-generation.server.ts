import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderShippingLabel } from "@/lib/shipping/server";
import { getSellerShippingSettings } from "@/lib/seller/shipping-settings";
import { resolveSellerCollectionAddress } from "@/lib/checkout/shipping-quotes.server";
import {
  applySelectedShippingQuotePayload,
  buildLegacyBridgeShippingQuote,
  resolveSelectedShippingQuoteForLabel,
  selectedSendcloudQuoteNeedsV3Discovery,
} from "@/lib/shipping/selected-shipping-quote-contract-v1";
import { parseSendcloudQuoteId } from "@/lib/shipping/pricing/sendcloud-mappers";
import { resolveAuthoritativeProviderShippingCostPence } from "@/lib/shipping/pricing/buyer-shipping-price-v1";
import { coerceShippingQuotePayload } from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import { createShippingAdminClient } from "@/lib/shipping/db-client";
import {
  appendAndSelectShippingQuoteWithoutReplacing,
  ensureShippingRecord,
  getShippingRecord,
  persistShippingRecordProviderCostPence,
  saveShippingQuotes,
  updateShippingQuotePayloadWithoutReplacing,
} from "@/lib/shipping/store";
import {
  getShipmentParcelById,
  createShipmentParcel,
  listShipmentParcelsForOrder,
  updateShipmentParcel,
  claimLabelGenerationAttempt,
  getProviderParcelIdForShipmentParcel,
} from "@/lib/shipping/parcels-repository";
import {
  PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL,
  parcelTierToDimensions,
  resolveCompleteParcelMeasurements,
  resolveLabelParcelMeasurements,
} from "@/lib/shipping/parcels";
import { resolveShipmentParcelForLabel } from "@/lib/shipping/resolve-shipment-parcel-for-label-v1";
import {
  buildLabelGenerationIdempotencyKey,
  LABEL_GENERATION_IN_PROGRESS_MESSAGE,
} from "@/lib/shipping/label-generation-idempotency-v1";
import {
  canonicalParcelMeasurements,
  getCanonicalParcelSizeByTier,
} from "@/lib/shipping/canonical-parcel-size-v1";
import {
  mustUseDemoShipping,
  mustUseDemoShippingForActors,
} from "@/lib/full-demo/security";
import type { ShippingLabelProviderFailure } from "@/lib/shipping/pricing/provider";
import { shippingLabelProviderFailure } from "@/lib/shipping/pricing/label-provider-failure-v1";
import {
  LOCAL_QUOTE_EXPIRED_LABEL_MESSAGE,
  isShippingQuoteLocallyExpiredForLabel,
} from "@/lib/shipping/shipping-quote-local-expiry-v1";
import {
  SELLER_SHIPPING_DEADLINE_EXPIRED_LABEL_MESSAGE,
  SELLER_SHIPPING_DEADLINE_V1,
  isSellerShippingDeadlineExpiredForLabel,
} from "@/lib/shipping/seller-shipping-deadline-v1";
import type { ShippingAddress, ShipmentParcel } from "@/lib/shipping/types";

export type GenerateShippingLabelForOrderFailure = {
  ok: false;
  error: string;
  providerFailure: ShippingLabelProviderFailure;
};

function shippingAddressHasRouteSnapshot(
  address: ShippingAddress | null | undefined,
): address is ShippingAddress {
  return Boolean(address?.postcode?.trim() && address.country?.trim());
}

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
      "id, order_number, seller_id, buyer_id, shipping_address_id, status, selected_shipping_quote_id, delivery_carrier, delivery_fee, paid_at, shipping_setup_status",
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
    .select("id, email, phone, full_name")
    .in("id", partyIds);
  const partyEmails = (partyProfiles ?? []).map((p) => p.email);
  const sellerDisplayName =
    (partyProfiles ?? []).find((profile) => profile.id === order.seller_id)
      ?.full_name?.trim() || "Seller";
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
  let selectedQuote = resolveSelectedShippingQuoteForLabel(
    record?.pricing?.quotes,
    quoteId,
  );
  if (!selectedQuote?.id) {
    // Fail closed: provider cost must come from shipping_quotes (Sendcloud), never delivery_fee.
    let providerPricePence: number | null = null;
    let recoveredPayload = null as ReturnType<typeof coerceShippingQuotePayload>;
    if (record?.id) {
      const shippingAdmin = createShippingAdminClient();
      const { data: quoteRows } = await shippingAdmin
        .from("shipping_quotes")
        .select("price_pence, quote_payload, carrier, service_name")
        .eq("shipping_record_id", record.id);
      const match = (
        (quoteRows ?? []) as Array<{
          price_pence?: number;
          quote_payload?: unknown;
          carrier?: string;
          service_name?: string;
        }>
      ).find((row) => {
        const payload = coerceShippingQuotePayload(row.quote_payload ?? null);
        return Boolean(
          payload?.externalQuoteId &&
            quoteId &&
            payload.externalQuoteId === quoteId,
        );
      });
      if (match) {
        recoveredPayload = coerceShippingQuotePayload(match.quote_payload ?? null);
        providerPricePence = resolveAuthoritativeProviderShippingCostPence({
          providerShippingCostPence: recoveredPayload?.providerShippingCostPence,
          quotePricePence: match.price_pence,
        });
      }
    }
    if (providerPricePence == null) {
      return rovexoValidationFailure(
        "Authoritative provider shipping cost is missing for the selected quote.",
      );
    }
    const checkoutIdentity = buildLegacyBridgeShippingQuote({
      quoteId,
      carrier:
        (typeof order.delivery_carrier === "string" && order.delivery_carrier.trim()) ||
        record?.carrier ||
        "Selected delivery",
      serviceName:
        (typeof order.delivery_carrier === "string" && order.delivery_carrier.trim()) ||
        record?.carrier ||
        undefined,
      pricePence: providerPricePence,
      payload: recoveredPayload,
    });
    if (resolveSelectedShippingQuoteForLabel([checkoutIdentity], quoteId)?.id) {
      try {
        record = await appendAndSelectShippingQuoteWithoutReplacing({
          orderId,
          quote: checkoutIdentity,
        });
        selectedQuote = resolveSelectedShippingQuoteForLabel(
          record?.pricing?.quotes,
          quoteId,
        );
      } catch {
        selectedQuote = null;
      }
    }
  }
  if (!selectedQuote?.id) {
    return rovexoValidationFailure(
      "Selected shipping quote could not be resolved for this order.",
    );
  }

  const providerCostPence = resolveAuthoritativeProviderShippingCostPence({
    quotePricePence: selectedQuote.pricePence,
  });
  if (providerCostPence == null) {
    return rovexoValidationFailure(
      "Authoritative provider shipping cost is missing for the selected quote.",
    );
  }
  // Ensure ShippingQuote.pricePence remains provider cost only.
  selectedQuote = { ...selectedQuote, pricePence: providerCostPence };
  // Always announce with the hydrated external quote id (sendcloud:N), never a row UUID.
  quoteId = selectedQuote.id;

  // Paid-before-snapshot records may have NULL collection/delivery on shipping_records.
  // Reuse the same existing resolvers as post-payment; persist fill-if-null; never fabricate.
  if (
    !forceDemoShipping &&
    !mustUseDemoShipping() &&
    selectedSendcloudQuoteNeedsV3Discovery(selectedQuote) &&
    (!shippingAddressHasRouteSnapshot(record?.collectionAddress) ||
      !shippingAddressHasRouteSnapshot(record?.deliveryAddress))
  ) {
    const collectionResolved = shippingAddressHasRouteSnapshot(record?.collectionAddress)
      ? record.collectionAddress
      : await resolveSellerCollectionAddress(order.seller_id, sellerDisplayName);
    const deliveryResolved = shippingAddressHasRouteSnapshot(record?.deliveryAddress)
      ? record.deliveryAddress
      : await resolveOrderDeliveryAddress(order.shipping_address_id);
    if (collectionResolved || deliveryResolved) {
      const persistedAddresses = await ensureShippingRecord({
        orderId,
        collectionAddress: collectionResolved ?? null,
        deliveryAddress: deliveryResolved ?? null,
      });
      if (persistedAddresses) record = persistedAddresses;
    }
  }

  // Recover confirmed V3 metadata for a V2-only selected quote via the existing catalog.
  // Never invents codes. Never changes selected quote identity. Existing V3 gate stays below.
  if (
    !forceDemoShipping &&
    !mustUseDemoShipping() &&
    selectedSendcloudQuoteNeedsV3Discovery(selectedQuote)
  ) {
    const methodId =
      selectedQuote.v2MethodId ?? parseSendcloudQuoteId(selectedQuote.id);
    const collection = record?.collectionAddress;
    const delivery = record?.deliveryAddress;
    const parcelTier = record?.parcelTier;
    if (
      methodId != null &&
      collection?.postcode?.trim() &&
      collection.country?.trim() &&
      delivery?.postcode?.trim() &&
      delivery.country?.trim() &&
      parcelTier
    ) {
      try {
        const {
          buildLiveCheckoutSendcloudV3Route,
          discoverConfirmedV3MetadataForV2Method,
        } = await import("@/lib/shipping/sendcloud/v3-catalog-v1");
        const parcelDef = getCanonicalParcelSizeByTier(parcelTier);
        const measurements = parcelDef ? canonicalParcelMeasurements(parcelDef) : null;
        const meta = await discoverConfirmedV3MetadataForV2Method({
          v2MethodId: methodId,
          route: buildLiveCheckoutSendcloudV3Route({
            fromCountryCode: collection.country,
            toCountryCode: delivery.country,
            fromPostalCode: collection.postcode,
            toPostalCode: delivery.postcode,
            parcelTier,
            weightKg: measurements?.weightKg,
          }),
        });
        if (meta?.shippingOptionCode) {
          const enriched = applySelectedShippingQuotePayload(selectedQuote, {
            externalQuoteId: selectedQuote.id,
            v2MethodId: methodId,
            shippingOptionCode: meta.shippingOptionCode,
            ...(meta.contractId ? { contractId: meta.contractId } : {}),
          });
          const persisted = await updateShippingQuotePayloadWithoutReplacing({
            orderId,
            quote: enriched,
          });
          if (persisted) {
            record = persisted;
            const again = resolveSelectedShippingQuoteForLabel(
              persisted.pricing?.quotes,
              quoteId,
            );
            if (again && !selectedSendcloudQuoteNeedsV3Discovery(again)) {
              selectedQuote = again;
            }
          }
        }
      } catch {
        selectedQuote = resolveSelectedShippingQuoteForLabel(
          record?.pricing?.quotes,
          quoteId,
        );
      }
    } else {
      console.warn("[shipping/label] V3 discovery skipped", {
        orderId,
        hasMethodId: methodId != null,
        hasCollectionRoute: shippingAddressHasRouteSnapshot(collection),
        hasDeliveryRoute: shippingAddressHasRouteSnapshot(delivery),
        hasParcelTier: Boolean(parcelTier),
      });
    }
  }

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

  // ParcelId omitted (Print Label { orderId }): eligibility resolver — never spawn extras.
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
    // Seed from order parcel_tier SSOT — Sell never collects free-form kg/cm.
    const tierSeed = record.parcelTier
      ? parcelTierToDimensions(record.parcelTier)
      : null;
    parcel = await createShipmentParcel({
      orderId,
      productItemIds: [],
      ...(tierSeed
        ? {
            weightKg: tierSeed.weightKg,
            lengthCm: tierSeed.lengthCm,
            widthCm: tierSeed.widthCm,
            heightCm: tierSeed.heightCm,
          }
        : {}),
    });
    // MEDIUM #7 — concurrent create race: re-resolve instead of failing closed on null.
    if (!parcel) {
      const racedParcels = await listShipmentParcelsForOrder(orderId);
      const racedResolution = resolveShipmentParcelForLabel({
        shippingRecordId: record.id,
        loadedExplicitParcel: null,
        orderParcels: racedParcels,
      });
      if (racedResolution.status === "use") {
        parcel = racedResolution.parcel;
      }
    }
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

  // P7.21: announce requires complete measurements on the parcel path.
  // Prefer shipment_parcels row; if null, hydrate once from shipping_records.parcel_tier
  // via parcelTierToDimensions (canonical Sell → checkout SSOT), persist, then announce.
  // Never invent free-form kg/cm. Adapter still refuses incomplete request fields.
  // Full Demo may omit measurements (demo adapter never calls Sendcloud).
  const allowDemoWithoutMeasurements = forceDemoShipping || mustUseDemoShipping();
  let parcelMeasurements = resolveLabelParcelMeasurements({
    weightKg: parcel.weightKg,
    dimensions: parcel.dimensions,
    parcelTier: record?.parcelTier,
  });
  const fromParcelRow = resolveCompleteParcelMeasurements({
    weightKg: parcel.weightKg,
    dimensions: parcel.dimensions,
  });
  if (!fromParcelRow && parcelMeasurements && parcel.id) {
    const hydrated = parcelMeasurements;
    const updated = await updateShipmentParcel(parcel.id, {
      weightKg: hydrated.weightKg,
      lengthCm: hydrated.lengthCm,
      widthCm: hydrated.widthCm,
      heightCm: hydrated.heightCm,
    });
    if (updated) {
      parcel = updated;
      parcelMeasurements = resolveCompleteParcelMeasurements({
        weightKg: updated.weightKg,
        dimensions: updated.dimensions,
      });
    }
  }
  if (!allowDemoWithoutMeasurements && !parcelMeasurements) {
    return rovexoValidationFailure(PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL);
  }

  const sellerSettings = await getSellerShippingSettings(sellerId);

  let existingProviderParcelId: number | null = null;
  if (parcel?.id) {
    existingProviderParcelId = await getProviderParcelIdForShipmentParcel(parcel.id);
  }

  // MEDIUM #6 — local expires_at fail-closed BEFORE any Sendcloud label call.
  // Skip only when a provider parcel already exists (idempotent announce reuse).
  // Missing expiresAt: do not invent — allow existing provider fail-safe.
  // Never auto-replace selected quote / carrier / buyer price / provider cost.
  const hasReusableProviderParcel =
    existingProviderParcelId != null && existingProviderParcelId > 0;
  if (
    !hasReusableProviderParcel &&
    isShippingQuoteLocallyExpiredForLabel({ expiresAt: selectedQuote?.expiresAt })
  ) {
    return rovexoValidationFailure(LOCAL_QUOTE_EXPIRED_LABEL_MESSAGE);
  }

  // MEDIUM #6 extension — ROVEXO seller deadline (3 calendar days from paid_at).
  // Independent from Sendcloud expires_at. Both must PASS for a new provider call.
  // Existing in-term labels (reusable provider parcel) remain valid — skip gate.
  // On expiry: fail closed, route to shipping_setup_status=repair_required recovery.
  // Never cancel order · never replace quote/carrier · never mutate buyer price.
  if (
    !hasReusableProviderParcel &&
    isSellerShippingDeadlineExpiredForLabel({
      paidAt: typeof order.paid_at === "string" ? order.paid_at : null,
    })
  ) {
    try {
      const currentSetup =
        typeof order.shipping_setup_status === "string"
          ? order.shipping_setup_status
          : null;
      if (currentSetup !== SELLER_SHIPPING_DEADLINE_V1.recoveryStatus) {
        await admin
          .from("orders")
          .update({
            shipping_setup_status: SELLER_SHIPPING_DEADLINE_V1.recoveryStatus,
          })
          .eq("id", orderId);
      }
    } catch {
      // Status routing is best-effort; label must still fail closed.
    }
    return rovexoValidationFailure(SELLER_SHIPPING_DEADLINE_EXPIRED_LABEL_MESSAGE);
  }

  // MEDIUM #7 — claim before Sendcloud announce (DB unique on shipment_parcel_id).
  // Concurrent POSTs / retries reuse ready label or existing provider parcel.
  // Never opens a second Sendcloud label for the same active parcel attempt.
  const labelClaim = await claimLabelGenerationAttempt({
    shippingRecordId: record.id,
    parcelId: parcel.id,
    parcelNumber: parcel.parcelNumber,
    totalParcels: parcel.totalParcels,
    carrier: selectedQuote?.carrier ?? parcel.carrier ?? null,
  });

  if (labelClaim.outcome === "reuse_ready") {
    const refreshed = await getShipmentParcelById(parcel.id);
    return {
      ok: true as const,
      label:
        refreshed?.label ??
        ({
          id: parcel.label?.id ?? parcel.id,
          pdfUrl: labelClaim.pdfUrl,
          labelUrl: labelClaim.pdfUrl,
          status: "ready" as const,
        } satisfies ShipmentParcel["label"]),
      record,
      parcel: refreshed ?? parcel,
      idempotent: true as const,
    };
  }

  if (labelClaim.outcome === "in_flight") {
    const refreshed = await getShipmentParcelById(parcel.id);
    if (
      refreshed?.label?.status === "ready" &&
      refreshed.trackingNumber &&
      refreshed.label.pdfUrl
    ) {
      return {
        ok: true as const,
        label: refreshed.label,
        record,
        parcel: refreshed,
        idempotent: true as const,
      };
    }
    const inFlightProviderId =
      refreshed?.providerParcelId && refreshed.providerParcelId > 0
        ? refreshed.providerParcelId
        : await getProviderParcelIdForShipmentParcel(parcel.id);
    if (inFlightProviderId != null && inFlightProviderId > 0) {
      existingProviderParcelId = inFlightProviderId;
    } else {
      return rovexoValidationFailure(LABEL_GENERATION_IN_PROGRESS_MESSAGE);
    }
  }

  if (labelClaim.outcome === "reuse_provider") {
    existingProviderParcelId = labelClaim.providerParcelId;
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
    idempotencyKey: buildLabelGenerationIdempotencyKey(orderId, parcel.parcelNumber),
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
    existingProviderAfterSave = await getProviderParcelIdForShipmentParcel(parcel.id);
  }

  // P8.6: successful announce persists provider parcel id even when tracking is async.
  const announcePersisted =
    existingProviderAfterSave != null && existingProviderAfterSave > 0;

  // Ledger: keep provider Sendcloud cost separate from locked buyer shipping.
  // Paid buyer price (orders.delivery_fee) must not be rewritten after payment.
  if (selectedQuote && (announcePersisted || trackingNumber)) {
    const labelCount = Math.max(1, Number(parcel.parcelNumber) || 1);
    const lockedBuyerShippingPricePence = Math.round(
      Math.max(0, Number(order.delivery_fee ?? 0)) * 100,
    );
    try {
      await updateShippingQuotePayloadWithoutReplacing({
        orderId,
        quote: selectedQuote,
        labelCount,
        lockedBuyerShippingPricePence,
      });
      await persistShippingRecordProviderCostPence({
        orderId,
        providerShippingCostPence: selectedQuote.pricePence,
      });
    } catch {
      // Non-fatal: label already created; pricing ledger best-effort.
    }
  }

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

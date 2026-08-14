/**
 * Provider ShippingQuote → CheckoutCarrierQuote (buyer price = provider + 10p).
 * Client-safe — no server-only imports.
 *
 * V1.0 Checkout presentation: ONE card per canonical carrier.
 * Flow: whitelist → eligibility filter → group → cheapest eligible → +10p once.
 */

import type { CheckoutCarrierQuote } from "@/lib/checkout/types";
import type { ParcelDimensions, ShippingQuote } from "@/lib/shipping/types";
import {
  penceToGbpMajor,
  toBuyerShippingPricePence,
} from "@/lib/shipping/pricing/buyer-shipping-price-v1";
import {
  filterV1_0CustomerFacingQuotes,
  formatV1_0CarrierDisplayName,
  resolveV1_0ActiveCarrier,
  V1_0_ACTIVE_CARRIERS,
  type V1_0ActiveCarrier,
} from "@/lib/shipping/v1-0-carrier-whitelist-v1";
import { formatCheckoutDeliveryEta } from "@/lib/shipping/delivery-estimate";
import { isDpdServicePointOptionCode } from "@/lib/shipping/sendcloud/dpd-label-engine-certification-v1";
import { isRoyalMailServicePointOptionCode } from "@/lib/shipping/sendcloud/royal-mail-label-engine-certification-v1";

export type CheckoutQuoteSelectionContext = {
  /**
   * Canonical parcel measurements (weight + max dims shippable envelope).
   * When present, quotes must prove weight eligibility via Sendcloud min/max —
   * never guessed from serviceName.
   */
  parcel?: ParcelDimensions | null;
};

function formatEta(quote: ShippingQuote): string {
  const transitDays =
    quote.estimatedDays.min > 0 && quote.estimatedDays.min === quote.estimatedDays.max
      ? quote.estimatedDays.min
      : quote.estimatedDays.min > 0
        ? quote.estimatedDays.min
        : null;

  return formatCheckoutDeliveryEta({
    estimatedDeliveryAt: quote.estimatedDeliveryAt,
    transitDays,
  });
}

/** Transit sort key — shorter delivery wins (min days, then max days). */
function transitSortKey(quote: ShippingQuote): number {
  const min = Number.isFinite(quote.estimatedDays?.min) ? quote.estimatedDays.min : 999;
  const max = Number.isFinite(quote.estimatedDays?.max) ? quote.estimatedDays.max : min;
  return Math.max(0, min) * 1_000 + Math.max(0, max);
}

function isHomeDeliveryEligible(quote: ShippingQuote): boolean {
  const code = quote.shippingOptionCode?.trim().toLowerCase() ?? "";
  const name = quote.serviceName.trim().toLowerCase();

  if (isRoyalMailServicePointOptionCode(quote.shippingOptionCode)) return false;
  if (isDpdServicePointOptionCode(quote.shippingOptionCode)) return false;
  if (
    code.includes("service_point") ||
    code.includes("servicepoint") ||
    code.includes("locker") ||
    code.includes("ship_to_shop") ||
    code.includes("shiptoshop") ||
    code.includes("parcelshop") ||
    code.includes("parcel_shop")
  ) {
    return false;
  }
  if (
    name.includes("service point") ||
    name.includes("locker") ||
    name.includes("parcelshop") ||
    name.includes("parcel shop") ||
    name.includes("ship to shop") ||
    name.includes("collect+") ||
    name.includes("local collect")
  ) {
    return false;
  }

  return true;
}

/**
 * Weight eligibility vs canonical parcel — fail closed when parcel context is set.
 * Uses Sendcloud-provided minWeightKg/maxWeightKg only. Never parses serviceName bands.
 */
export function isQuoteWeightEligibleForParcel(
  quote: ShippingQuote,
  parcel: ParcelDimensions | null | undefined,
): boolean {
  if (!parcel) return true;
  if (!Number.isFinite(parcel.weightKg) || parcel.weightKg <= 0) return false;

  const min = quote.minWeightKg;
  const max = quote.maxWeightKg;
  if (
    min == null ||
    max == null ||
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    min < 0 ||
    max < min
  ) {
    // Eligibility cannot be established → INELIGIBLE
    return false;
  }

  return parcel.weightKg >= min && parcel.weightKg <= max;
}

/**
 * Checkout V1.0 eligibility — fail closed.
 * Destination / method availability are enforced upstream in Sendcloud quote fetch.
 * Here: carrier whitelist · home-delivery · optional parcel weight envelope.
 */
export function isCheckoutEligibleProviderQuote(
  quote: ShippingQuote,
  context?: CheckoutQuoteSelectionContext,
): boolean {
  if (!Number.isFinite(quote.pricePence) || quote.pricePence < 0) return false;
  if (!quote.serviceName?.trim()) return false;
  if (!resolveV1_0ActiveCarrier(String(quote.carrier))) return false;
  if (!isHomeDeliveryEligible(quote)) return false;
  if (!isQuoteWeightEligibleForParcel(quote, context?.parcel)) return false;
  return true;
}

export function filterCheckoutEligibleProviderQuotes(
  quotes: ShippingQuote[],
  context?: CheckoutQuoteSelectionContext,
): ShippingQuote[] {
  return filterV1_0CustomerFacingQuotes(quotes).filter((quote) =>
    isCheckoutEligibleProviderQuote(quote, context),
  );
}

/**
 * Best quote within one carrier group (eligible quotes only).
 * Absolute rule: lowest provider price wins.
 * Ties only: shorter transit, then deterministic stable id.
 * Never: first API quote · name preference · preset service · weight-band substitution.
 */
export function selectBestQuoteForCarrier(
  quotes: ShippingQuote[],
  context?: CheckoutQuoteSelectionContext,
): ShippingQuote | null {
  const eligible = quotes.filter((quote) => isCheckoutEligibleProviderQuote(quote, context));
  if (eligible.length === 0) return null;
  return [...eligible].sort((a, b) => {
    const aProvider = Math.max(0, Math.trunc(a.pricePence));
    const bProvider = Math.max(0, Math.trunc(b.pricePence));
    if (aProvider !== bProvider) return aProvider - bProvider;
    const aTransit = transitSortKey(a);
    const bTransit = transitSortKey(b);
    if (aTransit !== bTransit) return aTransit - bTransit;
    return String(a.id).localeCompare(String(b.id));
  })[0]!;
}

/**
 * Group provider quotes by canonical v1.0 carrier (eligible only).
 * InPost / unknown / service-point / invalid price / weight-ineligible → excluded.
 */
export function groupCheckoutQuotesByCarrier(
  quotes: ShippingQuote[],
  context?: CheckoutQuoteSelectionContext,
): Map<V1_0ActiveCarrier, ShippingQuote[]> {
  const allowed = filterCheckoutEligibleProviderQuotes(quotes, context);
  const groups = new Map<V1_0ActiveCarrier, ShippingQuote[]>();

  for (const quote of allowed) {
    const carrier = resolveV1_0ActiveCarrier(String(quote.carrier));
    if (!carrier) continue;
    const list = groups.get(carrier) ?? [];
    list.push(quote);
    groups.set(carrier, list);
  }

  return groups;
}

function toCheckoutCarrierQuote(quote: ShippingQuote): CheckoutCarrierQuote {
  const carrier = resolveV1_0ActiveCarrier(String(quote.carrier)) ?? String(quote.carrier);
  const buyerPricePence = toBuyerShippingPricePence(quote.pricePence);
  return {
    id: quote.id,
    carrier,
    carrierDisplayName: formatV1_0CarrierDisplayName(String(carrier)),
    serviceName: quote.serviceName,
    price: penceToGbpMajor(buyerPricePence),
    providerPricePence: Math.max(0, Math.trunc(quote.pricePence)),
    buyerPricePence,
    eta: formatEta(quote),
    ...(quote.shippingOptionCode ? { shippingOptionCode: quote.shippingOptionCode } : {}),
    ...(quote.contractId ? { contractId: quote.contractId } : {}),
    ...(quote.v2MethodId != null ? { v2MethodId: quote.v2MethodId } : {}),
    ...(quote.quoteApiVersion ? { quoteApiVersion: quote.quoteApiVersion } : {}),
  };
}

/**
 * Map provider quotes → checkout options.
 * Buyer price = provider pence + 10 (canonical, once). Fail-closed v1.0 whitelist.
 * ONE customer-facing option per carrier (cheapest eligible quote only).
 */
export function mapProviderQuotesToCheckoutOptions(
  quotes: ShippingQuote[],
  context?: CheckoutQuoteSelectionContext,
): CheckoutCarrierQuote[] {
  const groups = groupCheckoutQuotesByCarrier(quotes, context);
  const orderIndex = new Map(
    V1_0_ACTIVE_CARRIERS.map((carrier, index) => [carrier, index] as const),
  );

  const bestPerCarrier: ShippingQuote[] = [];
  for (const carrier of V1_0_ACTIVE_CARRIERS) {
    const group = groups.get(carrier);
    if (!group?.length) continue;
    const best = selectBestQuoteForCarrier(group, context);
    if (best) bestPerCarrier.push(best);
  }

  for (const [carrier, group] of groups) {
    if (orderIndex.has(carrier)) continue;
    const best = selectBestQuoteForCarrier(group, context);
    if (best) bestPerCarrier.push(best);
  }

  return bestPerCarrier.map(toCheckoutCarrierQuote);
}

/**
 * MEDIUM #5 — Post-payment live quote enrichment is metadata-only.
 *
 * After payment, these are IMMUTABLE:
 * - selected_shipping_quote_id
 * - carrier identity
 * - buyer_shipping_price (paid)
 * - provider_shipping_cost locked with the paid quote
 * - shipping_records shipment identity
 *
 * Live enrichment may only fill missing provider metadata
 * (shippingOptionCode, contractId, quoteApiVersion, serviceName, ETA).
 * Never use orders.delivery_fee as provider cost.
 */

import {
  applySelectedShippingQuotePayload,
  resolveSelectedShippingQuoteForLabel,
} from "@/lib/shipping/selected-shipping-quote-contract-v1";
import type { ShippingQuote } from "@/lib/shipping/types";


export const POST_PAYMENT_QUOTE_ENRICHMENT_V1 = {
  version: "v1.0",
  rule: "AFTER_PAYMENT_METADATA_ONLY",
  immutable: [
    "selected_shipping_quote_id",
    "carrier",
    "buyer_shipping_price",
    "provider_shipping_cost",
    "shipment_identity",
  ] as const,
  allowedOverlay: [
    "shippingOptionCode",
    "contractId",
    "quoteApiVersion",
    "v2MethodId",
    "serviceName",
    "estimatedDays",
  ] as const,
  forbidden: [
    "replace_selected_quote_id",
    "replace_carrier",
    "replace_buyer_shipping_price",
    "replace_provider_shipping_cost",
    "delivery_fee_as_provider_cost",
  ] as const,
} as const;

function carriersMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = String(a ?? "")
    .trim()
    .toLowerCase();
  const right = String(b ?? "")
    .trim()
    .toLowerCase();
  if (!left || !right) return false;
  return left === right;
}

/** True when live quote is the same paid selection (id / sendcloud:N / v2MethodId). */
export function liveQuoteMatchesLockedSelection(
  liveQuote: ShippingQuote | null | undefined,
  lockedQuoteId: string,
): boolean {
  if (!liveQuote || !lockedQuoteId.trim()) return false;
  return resolveSelectedShippingQuoteForLabel([liveQuote], lockedQuoteId) != null;
}

/**
 * Overlay missing metadata from a live quote onto the paid locked quote.
 * On identity / carrier mismatch: return locked quote unchanged.
 * Never replaces provider cost or buyer price. Never uses delivery_fee.
 */
export function overlayPostPaymentLiveQuoteMetadata(input: {
  lockedQuote: ShippingQuote;
  liveQuote: ShippingQuote | null | undefined;
  /** Authoritative paid provider cost (pence). Required — never delivery_fee. */
  lockedProviderShippingCostPence: number;
}): ShippingQuote {
  const lockedId = String(input.lockedQuote.id).trim();
  const lockedProvider = Math.max(0, Math.trunc(input.lockedProviderShippingCostPence));
  const locked: ShippingQuote = {
    ...input.lockedQuote,
    id: lockedId,
    carrier: input.lockedQuote.carrier,
    pricePence: lockedProvider,
  };

  const live = input.liveQuote;
  if (!live) return locked;
  if (!liveQuoteMatchesLockedSelection(live, lockedId)) return locked;
  if (!carriersMatch(live.carrier, locked.carrier)) return locked;

  // Same identity + carrier: fill missing metadata only. Never take live price.
  const withMeta = applySelectedShippingQuotePayload(locked, {
    externalQuoteId: lockedId,
    v2MethodId: locked.v2MethodId ?? live.v2MethodId,
    shippingOptionCode: live.shippingOptionCode,
    contractId: live.contractId,
  });

  const lockedService = locked.serviceName?.trim() || "";
  const lockedCarrier = String(locked.carrier).trim().toLowerCase();
  const serviceName =
    lockedService && lockedService.toLowerCase() !== lockedCarrier
      ? locked.serviceName
      : live.serviceName?.trim() || locked.serviceName;

  const estimatedDays =
    locked.estimatedDays?.min != null && locked.estimatedDays?.max != null
      ? locked.estimatedDays
      : (live.estimatedDays ?? locked.estimatedDays);

  return {
    ...withMeta,
    id: lockedId,
    carrier: locked.carrier,
    pricePence: lockedProvider,
    ...(serviceName ? { serviceName } : {}),
    ...(estimatedDays ? { estimatedDays } : {}),
  };
}

/**
 * Paid-order quote pool write: keep locked selection, never adopt a different live id.
 */
export function buildPostPaymentMetadataOnlyQuotePool(input: {
  lockedQuote: ShippingQuote;
  liveQuotes: ShippingQuote[];
  existingQuotes?: ShippingQuote[];
}): { quotes: ShippingQuote[]; selectedQuoteId: string } {
  const liveSelected = resolveSelectedShippingQuoteForLabel(
    input.liveQuotes,
    input.lockedQuote.id,
  );
  const overlayed = overlayPostPaymentLiveQuoteMetadata({
    lockedQuote: input.lockedQuote,
    liveQuote: liveSelected,
    lockedProviderShippingCostPence: input.lockedQuote.pricePence,
  });

  const existing = input.existingQuotes ?? [];
  const others = existing.filter((quote) => quote.id !== overlayed.id);
  return {
    quotes: [...others, overlayed],
    selectedQuoteId: overlayed.id,
  };
}

/**
 * P7.13 — Canonical selected shipping quote metadata contract.
 *
 * Checkout live quote → persist exact provider metadata → label generation.
 * Never invent shippingOptionCode from sendcloud:<methodId> / v2MethodId.
 */

import type { CheckoutCarrierQuote } from "@/lib/checkout/types";
import {
  buildShippingQuotePayload,
  isConfirmedSendcloudV3ShippingOptionCode,
  resolveShippingQuoteApiVersion,
} from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import { isSendcloudQuoteId, parseSendcloudQuoteId } from "@/lib/shipping/pricing/sendcloud-mappers";
import {
  separateShippingPricesPence,
  toBuyerShippingPricePence,
} from "@/lib/shipping/pricing/buyer-shipping-price-v1";
import type {
  ShippingQuote,
  ShippingQuoteApiVersion,
  ShippingQuotePayload,
} from "@/lib/shipping/types";

function normalizeContractId(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function normalizeQuoteApiVersion(value: unknown): ShippingQuoteApiVersion | undefined {
  if (value === "v2" || value === "v3" || value === "v2+v3") return value;
  return undefined;
}

/**
 * Build a ShippingQuote from the exact checkout carrier option the buyer selected.
 * Preserves shippingOptionCode / contractId / v2MethodId / quoteApiVersion when present.
 */
export function shippingQuoteFromCheckoutCarrierQuote(
  quote: CheckoutCarrierQuote,
): ShippingQuote {
  const v2MethodId =
    quote.v2MethodId != null && Number.isFinite(quote.v2MethodId) && quote.v2MethodId > 0
      ? quote.v2MethodId
      : isSendcloudQuoteId(quote.id)
        ? parseSendcloudQuoteId(quote.id)
        : null;
  const shippingOptionCode = isConfirmedSendcloudV3ShippingOptionCode(
    quote.shippingOptionCode,
    v2MethodId,
  )
    ? quote.shippingOptionCode.trim()
    : undefined;
  const contractId = normalizeContractId(quote.contractId);
  const quoteApiVersion =
    normalizeQuoteApiVersion(quote.quoteApiVersion) ??
    resolveShippingQuoteApiVersion({ shippingOptionCode, v2MethodId });

  const providerPricePence =
    typeof quote.providerPricePence === "number" && Number.isFinite(quote.providerPricePence)
      ? Math.max(0, Math.trunc(quote.providerPricePence))
      : null;

  // Fail closed: never invent provider cost from buyerPricePence / price (buyer fee).
  if (providerPricePence == null) {
    return {
      id: quote.id,
      providerId: isSendcloudQuoteId(quote.id) ? "sendcloud" : "checkout",
      carrier: quote.carrier,
      serviceName: quote.serviceName,
      pricePence: 0,
      currency: "GBP",
      estimatedDays: { min: 1, max: 5 },
      ...(v2MethodId != null ? { v2MethodId } : {}),
      ...(shippingOptionCode ? { shippingOptionCode } : {}),
      ...(contractId ? { contractId } : {}),
      quoteApiVersion,
    };
  }

  return {
    id: quote.id,
    providerId: isSendcloudQuoteId(quote.id) ? "sendcloud" : "checkout",
    carrier: quote.carrier,
    serviceName: quote.serviceName,
    // ShippingQuote.pricePence is ALWAYS the provider cost — never buyer delivery_fee.
    pricePence: providerPricePence,
    currency: "GBP",
    estimatedDays: { min: 1, max: 5 },
    ...(v2MethodId != null ? { v2MethodId } : {}),
    ...(shippingOptionCode ? { shippingOptionCode } : {}),
    ...(contractId ? { contractId } : {}),
    quoteApiVersion,
  };
}

/** Persistable jsonb for checkout_sessions / orders — exact provider values only. */
export function buildSelectedShippingQuotePayload(
  quote: CheckoutCarrierQuote | ShippingQuote,
): ShippingQuotePayload {
  if ("pricePence" in quote) {
    return buildShippingQuotePayload(quote);
  }
  const shippingQuote = shippingQuoteFromCheckoutCarrierQuote(quote);
  const base = buildShippingQuotePayload(shippingQuote);
  const provider =
    typeof quote.providerPricePence === "number" && Number.isFinite(quote.providerPricePence)
      ? Math.max(0, Math.trunc(quote.providerPricePence))
      : shippingQuote.pricePence;
  const buyer =
    typeof quote.buyerPricePence === "number" && Number.isFinite(quote.buyerPricePence)
      ? Math.max(0, Math.trunc(quote.buyerPricePence))
      : toBuyerShippingPricePence(provider, 1);
  const separated = separateShippingPricesPence({
    providerShippingCostPence: provider,
    labelCount: 1,
  });
  return {
    ...base,
    providerShippingCostPence: separated.providerShippingCostPence,
    buyerShippingPricePence: buyer,
    rovexoMarginPence: separated.rovexoMarginPence,
    labelCount: separated.labelCount,
  };
}

function payloadFromUnknownQuoteSource(
  source: CheckoutCarrierQuote | ShippingQuote | ShippingQuotePayload | null | undefined,
): ShippingQuotePayload | null {
  if (!source) return null;
  if ("externalQuoteId" in source) {
    return parseSelectedShippingQuotePayload(source);
  }
  return buildSelectedShippingQuotePayload(source);
}

/**
 * Confirmed V3 payload only. Never invents codes from sendcloud:N / method id.
 */
export function confirmedV3PayloadFromSelectedQuote(
  source: CheckoutCarrierQuote | ShippingQuote | ShippingQuotePayload | null | undefined,
): ShippingQuotePayload | null {
  const payload = payloadFromUnknownQuoteSource(source);
  if (
    !payload ||
    !isConfirmedSendcloudV3ShippingOptionCode(payload.shippingOptionCode, payload.v2MethodId)
  ) {
    return null;
  }
  return payload;
}

/**
 * Recover confirmed checkout V3 fields from Stripe / session metadata.
 * Only attaches shippingOptionCode when the confirmation helper accepts it.
 */
export function parseConfirmedShippingQuotePayloadFromMetadata(input: {
  selectedQuoteId?: string | null;
  shippingOptionCode?: string | null;
  contractId?: string | null;
  v2MethodId?: number | null;
}): ShippingQuotePayload | null {
  const selectedQuoteId = input.selectedQuoteId?.trim() || "";
  if (!selectedQuoteId) return null;
  const v2MethodId =
    input.v2MethodId != null && Number.isFinite(input.v2MethodId) && input.v2MethodId > 0
      ? input.v2MethodId
      : isSendcloudQuoteId(selectedQuoteId)
        ? parseSendcloudQuoteId(selectedQuoteId)
        : undefined;
  return confirmedV3PayloadFromSelectedQuote({
    externalQuoteId: selectedQuoteId,
    ...(v2MethodId != null ? { v2MethodId } : {}),
    ...(typeof input.shippingOptionCode === "string"
      ? { shippingOptionCode: input.shippingOptionCode }
      : {}),
    ...(typeof input.contractId === "string" ? { contractId: input.contractId } : {}),
  });
}

/**
 * Canonical persistable checkout quote.
 * Preserves confirmed V3 metadata when the live/selected quote already has it.
 * Never invents shippingOptionCode. Never replaces sendcloud:N identity.
 */
export function buildPersistedCheckoutQuote(input: {
  selectedQuoteId: string | null | undefined;
  carrier: string;
  serviceName?: string;
  pricePence: number;
  payload?: CheckoutCarrierQuote | ShippingQuote | ShippingQuotePayload | null;
}): ShippingQuote | null {
  const quoteId = input.selectedQuoteId?.trim() || null;
  if (!quoteId) return null;
  return buildLegacyBridgeShippingQuote({
    quoteId,
    carrier: input.carrier,
    serviceName: input.serviceName,
    pricePence: input.pricePence,
    payload: payloadFromUnknownQuoteSource(input.payload),
  });
}

export function parseSelectedShippingQuotePayload(
  raw: unknown,
): ShippingQuotePayload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const externalQuoteId =
    typeof row.externalQuoteId === "string" && row.externalQuoteId.trim()
      ? row.externalQuoteId.trim()
      : null;
  if (!externalQuoteId) return null;

  const v2MethodId =
    typeof row.v2MethodId === "number" && Number.isFinite(row.v2MethodId) && row.v2MethodId > 0
      ? row.v2MethodId
      : undefined;
  const shippingOptionCode = isConfirmedSendcloudV3ShippingOptionCode(
    typeof row.shippingOptionCode === "string" ? row.shippingOptionCode : null,
    v2MethodId,
  )
    ? (row.shippingOptionCode as string).trim()
    : undefined;
  const contractId = normalizeContractId(row.contractId);
  const quoteApiVersion =
    normalizeQuoteApiVersion(row.quoteApiVersion) ??
    resolveShippingQuoteApiVersion({ shippingOptionCode, v2MethodId });

  return {
    externalQuoteId,
    ...(v2MethodId != null ? { v2MethodId } : {}),
    ...(shippingOptionCode ? { shippingOptionCode } : {}),
    ...(contractId ? { contractId } : {}),
    quoteApiVersion,
  };
}

/**
 * Resolve the quote used for label generation (P8.5).
 * Deterministic identity only — never quotes[0], never first-V3 guess.
 *
 * Match order:
 * 1. hydrated quote.id === selectedQuoteId (external e.g. sendcloud:27227)
 * 2. quote.quoteRowId === selectedQuoteId (shipping_quotes row UUID)
 * 3. sendcloud:N ↔ v2MethodId on a hydrated quote
 *
 * Missing / unresolvable selection → null (fail closed; do not call Sendcloud).
 */
export function resolveSelectedShippingQuoteForLabel(
  quotes: ShippingQuote[] | null | undefined,
  selectedQuoteId: string | null | undefined,
): ShippingQuote | null {
  if (!quotes?.length) return null;
  const selected = typeof selectedQuoteId === "string" ? selectedQuoteId.trim() : "";
  if (!selected) return null;

  const exact = quotes.find((q) => q.id === selected);
  if (exact) return exact;

  const byRow = quotes.find((q) => q.quoteRowId === selected);
  if (byRow) return byRow;

  if (isSendcloudQuoteId(selected)) {
    const methodId = parseSendcloudQuoteId(selected);
    if (methodId != null) {
      const byMethod = quotes.find((q) => q.v2MethodId === methodId);
      if (byMethod) return byMethod;
    }
  }

  return null;
}

/** True when a resolved Sendcloud quote still has no confirmed V3 shippingOptionCode. */
export function selectedSendcloudQuoteNeedsV3Discovery(
  quote: ShippingQuote | null | undefined,
): boolean {
  if (!quote || quote.providerId !== "sendcloud") return false;
  return !isConfirmedSendcloudV3ShippingOptionCode(
    quote.shippingOptionCode,
    quote.v2MethodId,
  );
}

/**
 * Checkout/quote eligibility: Sendcloud methods are offerable only when the
 * confirmed V3 identity survived the existing route-aware catalog gate.
 * Never treats sendcloud:N / digits-only as a shippingOptionCode.
 */
export function isRouteProvenSendcloudQuote(
  quote: ShippingQuote | null | undefined,
): boolean {
  if (!quote || quote.providerId !== "sendcloud") return false;
  return isConfirmedSendcloudV3ShippingOptionCode(
    quote.shippingOptionCode,
    quote.v2MethodId,
  );
}

/**
 * Keep the checkout-selected quote identity.
 * If it already hydrates from quotes, return the hydrated external id.
 * If it is absent from quotes, return the selected id unchanged.
 * Never substitute another quote by price, carrier, or first-list fallback.
 */
export function retainCheckoutSelectedQuoteId(
  quotes: ShippingQuote[] | null | undefined,
  selectedQuoteId: string | null | undefined,
): string | null {
  const selected = typeof selectedQuoteId === "string" ? selectedQuoteId.trim() : "";
  if (!selected) return null;
  const resolved = resolveSelectedShippingQuoteForLabel(quotes, selected);
  return resolved?.id ?? selected;
}

/**
 * Overlay confirmed checkout payload onto a base quote.
 * Never invents codes. Never reformats confirmed shippingOptionCode.
 * Prefer existing confirmed base.shippingOptionCode when already present.
 */
export function applySelectedShippingQuotePayload(
  base: ShippingQuote,
  payload: ShippingQuotePayload | null | undefined,
): ShippingQuote {
  if (!payload) return base;
  if (payload.externalQuoteId && payload.externalQuoteId !== base.id) {
    return base;
  }

  const baseCode = isConfirmedSendcloudV3ShippingOptionCode(
    base.shippingOptionCode,
    base.v2MethodId,
  )
    ? base.shippingOptionCode!.trim()
    : undefined;
  const payloadCode = isConfirmedSendcloudV3ShippingOptionCode(
    payload.shippingOptionCode,
    payload.v2MethodId ?? base.v2MethodId,
  )
    ? payload.shippingOptionCode!.trim()
    : undefined;
  const shippingOptionCode = baseCode ?? payloadCode;

  const contractId =
    (typeof base.contractId === "string" && base.contractId.trim()
      ? base.contractId.trim()
      : undefined) ??
    (typeof payload.contractId === "string" && payload.contractId.trim()
      ? payload.contractId.trim()
      : undefined);

  const v2MethodId = base.v2MethodId ?? payload.v2MethodId;
  // Always derive from final confirmed fields — never keep stale "v2" after V3 overlay.
  const quoteApiVersion = resolveShippingQuoteApiVersion({
    shippingOptionCode,
    v2MethodId,
  });

  return {
    ...base,
    ...(v2MethodId != null ? { v2MethodId } : {}),
    ...(shippingOptionCode ? { shippingOptionCode } : {}),
    ...(contractId ? { contractId } : {}),
    quoteApiVersion,
  };
}

/**
 * Legacy bridge from selected_shipping_quote_id alone — V2 identity only.
 * Never invents shippingOptionCode.
 */
export function buildLegacyBridgeShippingQuote(input: {
  quoteId: string;
  carrier: string;
  serviceName?: string;
  pricePence: number;
  payload?: ShippingQuotePayload | null;
}): ShippingQuote {
  const v2MethodId = isSendcloudQuoteId(input.quoteId)
    ? parseSendcloudQuoteId(input.quoteId)
    : null;
  const base: ShippingQuote = {
    id: input.quoteId,
    providerId: isSendcloudQuoteId(input.quoteId) ? "sendcloud" : "checkout",
    carrier: input.carrier.trim(),
    serviceName: input.serviceName || input.carrier || "Selected delivery",
    pricePence: Math.max(0, Math.round(input.pricePence)),
    currency: "GBP",
    estimatedDays: { min: 1, max: 5 },
    ...(v2MethodId != null ? { v2MethodId, quoteApiVersion: "v2" as const } : {}),
  };
  return applySelectedShippingQuotePayload(base, input.payload ?? null);
}

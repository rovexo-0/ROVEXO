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

  return {
    id: quote.id,
    providerId: isSendcloudQuoteId(quote.id) ? "sendcloud" : "checkout",
    carrier: quote.carrier,
    serviceName: quote.serviceName,
    pricePence: Math.round(Math.max(0, Number(quote.price) || 0) * 100),
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
  return buildShippingQuotePayload(shippingQuoteFromCheckoutCarrierQuote(quote));
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
 * Resolve the quote used for label generation.
 * Prefer exact selectedQuoteId match (external id e.g. sendcloud:27227).
 * When selected_quote_id is a shipping_quotes row UUID, hydrated quote.id is the
 * external id — exact match fails; prefer a quote that already has a confirmed V3
 * shippingOptionCode instead of blindly taking quotes[0] (P7.35).
 */
export function resolveSelectedShippingQuoteForLabel(
  quotes: ShippingQuote[] | null | undefined,
  selectedQuoteId: string | null | undefined,
): ShippingQuote | null {
  if (!quotes?.length) return null;
  if (selectedQuoteId) {
    const exact = quotes.find((q) => q.id === selectedQuoteId);
    if (exact) return exact;
  }
  const withV3 = quotes.find((q) =>
    isConfirmedSendcloudV3ShippingOptionCode(q.shippingOptionCode, q.v2MethodId),
  );
  if (withV3) return withV3;
  return quotes[0] ?? null;
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
    carrier: input.carrier || "Royal Mail",
    serviceName: input.serviceName || input.carrier || "Selected delivery",
    pricePence: Math.max(0, Math.round(input.pricePence)),
    currency: "GBP",
    estimatedDays: { min: 1, max: 5 },
    ...(v2MethodId != null ? { v2MethodId, quoteApiVersion: "v2" as const } : {}),
  };
  return applySelectedShippingQuotePayload(base, input.payload ?? null);
}

/**
 * Pure V3 catalog parsers + quote identity helpers.
 * No Super Admin / order coupling. Safe for checkout quote enrichment.
 */

import type {
  ShippingQuote,
  ShippingQuoteApiVersion,
  ShippingQuotePayload,
} from "@/lib/shipping/types";
import type { SendcloudV3MethodMapping } from "@/lib/shipping/sendcloud/v3-catalog-types-v1";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function str(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t || t.toLowerCase() === "null") return null;
    return t;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

/**
 * Reject values that are clearly V2 method identities — never treat as V3 codes.
 * Does NOT invent substitutes; only validates confirmed Sendcloud strings.
 */
export function isConfirmedSendcloudV3ShippingOptionCode(
  code: string | null | undefined,
  v2MethodId?: number | null,
): code is string {
  if (code == null) return false;
  const trimmed = code.trim();
  if (!trimmed) return false;
  if (/^\d+$/.test(trimmed)) return false;
  if (/^sendcloud:/i.test(trimmed)) return false;
  if (v2MethodId != null && trimmed === String(v2MethodId)) return false;
  return true;
}

/**
 * Parse official POST /compat/shipping-options response:
 * { data: { "29631": "royal_mail:..." | null } }
 * Never invents codes when null/missing.
 */
export function parseSendcloudV3CompatMappings(
  body: unknown,
  requestedMethodIds: number[],
): Map<number, SendcloudV3MethodMapping> {
  const root = asRecord(body);
  const data = asRecord(root?.data) ?? {};
  const out = new Map<number, SendcloudV3MethodMapping>();

  for (const methodId of requestedMethodIds) {
    const raw = data[String(methodId)];
    const codeRaw = str(raw);
    const confirmed = isConfirmedSendcloudV3ShippingOptionCode(codeRaw, methodId)
      ? codeRaw
      : null;
    out.set(methodId, {
      v2MethodId: methodId,
      shippingOptionCode: confirmed,
      contractId: null,
      result: confirmed ? "MAPPING_CONFIRMED" : "NO_V3_COUNTERPART",
    });
  }

  return out;
}

export function resolveShippingQuoteApiVersion(input: {
  shippingOptionCode?: string | null;
  v2MethodId?: number | null;
}): ShippingQuoteApiVersion {
  const hasV3 = isConfirmedSendcloudV3ShippingOptionCode(
    input.shippingOptionCode,
    input.v2MethodId,
  );
  const hasV2 = input.v2MethodId != null && Number.isFinite(input.v2MethodId) && input.v2MethodId > 0;
  if (hasV3 && hasV2) return "v2+v3";
  if (hasV3) return "v3";
  return "v2";
}

export function buildShippingQuotePayload(quote: ShippingQuote): ShippingQuotePayload {
  const externalQuoteId = String(quote.id);
  const v2MethodId =
    quote.v2MethodId != null && Number.isFinite(quote.v2MethodId) && quote.v2MethodId > 0
      ? quote.v2MethodId
      : undefined;
  const shippingOptionCode = isConfirmedSendcloudV3ShippingOptionCode(
    quote.shippingOptionCode,
    v2MethodId,
  )
    ? quote.shippingOptionCode.trim()
    : undefined;
  const contractId =
    typeof quote.contractId === "string" && quote.contractId.trim()
      ? quote.contractId.trim()
      : undefined;
  const quoteApiVersion =
    quote.quoteApiVersion ??
    resolveShippingQuoteApiVersion({ shippingOptionCode, v2MethodId });

  return {
    externalQuoteId,
    ...(v2MethodId != null ? { v2MethodId } : {}),
    ...(shippingOptionCode ? { shippingOptionCode } : {}),
    ...(contractId ? { contractId } : {}),
    quoteApiVersion,
  };
}

export function shippingQuoteFromPayloadRow(input: {
  id: string;
  providerId: string;
  carrier: string;
  serviceName: string;
  pricePence: number;
  currency: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  recommended: string | null;
  expiresAt: string | null;
  quotePayload?: ShippingQuotePayload | { externalQuoteId?: string } | null;
}): ShippingQuote {
  const payload = (input.quotePayload ?? null) as ShippingQuotePayload | null;
  const externalId = payload?.externalQuoteId ?? input.id;
  const v2MethodId =
    typeof payload?.v2MethodId === "number" && payload.v2MethodId > 0
      ? payload.v2MethodId
      : undefined;
  const shippingOptionCode = isConfirmedSendcloudV3ShippingOptionCode(
    payload?.shippingOptionCode,
    v2MethodId,
  )
    ? payload!.shippingOptionCode!.trim()
    : undefined;
  const contractId =
    typeof payload?.contractId === "string" && payload.contractId.trim()
      ? payload.contractId.trim()
      : undefined;
  const quoteApiVersion =
    payload?.quoteApiVersion ??
    resolveShippingQuoteApiVersion({ shippingOptionCode, v2MethodId });

  return {
    id: externalId,
    providerId: input.providerId,
    carrier: input.carrier,
    serviceName: input.serviceName,
    pricePence: input.pricePence,
    currency: "GBP",
    estimatedDays: { min: input.estimatedDaysMin, max: input.estimatedDaysMax },
    recommended:
      input.recommended === "cheapest" || input.recommended === "fastest"
        ? input.recommended
        : undefined,
    expiresAt: input.expiresAt ?? undefined,
    ...(v2MethodId != null ? { v2MethodId } : {}),
    ...(shippingOptionCode ? { shippingOptionCode } : {}),
    ...(contractId ? { contractId } : {}),
    quoteApiVersion,
  };
}

/**
 * Extract tracking + label from V3 announce response (201 or 409 body).
 * Never fabricates URLs or tracking numbers.
 */
export function parseSendcloudV3AnnounceShipmentResult(
  body: unknown,
  options?: { reusedExisting?: boolean },
): {
  shipmentId: string | null;
  parcelId: number | null;
  trackingNumber: string | null;
  pdfUrl: string | null;
  carrierCode: string | null;
  serviceName: string | null;
  reusedExisting: boolean;
} {
  const root = asRecord(body);
  const data = asRecord(root?.data) ?? root;
  const parcels = Array.isArray(data?.parcels) ? (data!.parcels as unknown[]) : [];
  const first = asRecord(parcels[0]);
  const documents = Array.isArray(first?.documents) ? (first!.documents as unknown[]) : [];
  let pdfUrl: string | null = null;
  for (const doc of documents) {
    const d = asRecord(doc);
    const link = str(d?.link);
    const type = str(d?.type)?.toLowerCase();
    if (link && (type === "label" || !type)) {
      pdfUrl = link;
      if (type === "label") break;
    }
  }

  const trackingNumber = str(first?.tracking_number);
  const parcelIdRaw = first?.id;
  const parcelId =
    typeof parcelIdRaw === "number" && Number.isFinite(parcelIdRaw)
      ? parcelIdRaw
      : typeof parcelIdRaw === "string" && /^\d+$/.test(parcelIdRaw)
        ? Number.parseInt(parcelIdRaw, 10)
        : null;

  const shipmentId = str(data?.id);
  const shipWith = asRecord(data?.ship_with);
  const props = asRecord(shipWith?.properties);
  const carrier = asRecord(first?.carrier) ?? asRecord(data?.carrier);

  return {
    shipmentId,
    parcelId,
    trackingNumber,
    pdfUrl,
    carrierCode: str(carrier?.code),
    serviceName: str(props?.shipping_option_code) ?? str(data?.shipping_option_code),
    reusedExisting: Boolean(options?.reusedExisting),
  };
}
